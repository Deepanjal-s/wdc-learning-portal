import { buildProgressSummary } from './progressService.js';
import { getUserTrackIds } from '../utils/userTracks.js';

/**
 * Coordinator admin-dashboard helpers.
 *
 * Every function here works on plain objects (lean query results or test
 * fixtures) and performs no database access, which keeps the dashboard cheap
 * on the Atlas free tier and easy to unit test.
 */

export function enrolledTrackIds(user) {
  return getUserTrackIds(user).map((id) => String(id));
}

function indexBy(documents, keyOf) {
  const map = new Map();
  for (const document of documents ?? []) {
    const key = String(keyOf(document));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(document);
  }
  return map;
}

function progressKey(userId, trackId) {
  return `${String(userId)}:${String(trackId)}`;
}

/**
 * Builds a per-track progress summary for one student, exactly the same way
 * the student dashboard computes it (same denominator, same percentage).
 */
export function summarizeTrackProgress({ track, tasksByTrack, resourcesByTrack, progressByUserTrack, userId }) {
  const trackId = String(track._id);
  return buildProgressSummary(
    track,
    tasksByTrack.get(trackId) ?? [],
    progressByUserTrack.get(progressKey(userId, trackId)) ?? null,
    resourcesByTrack.get(trackId) ?? [],
  );
}

export function countStudentsByTrack(students, tracks) {
  return tracks.map((track) => {
    const trackId = String(track._id);
    const count = students.filter((student) => enrolledTrackIds(student).includes(trackId)).length;
    return { slug: track.slug, title: track.title, count };
  });
}

export function lastActivityFor(progressDocs) {
  let latest = null;
  for (const document of progressDocs ?? []) {
    const updatedAt = document?.updatedAt;
    if (updatedAt && (!latest || updatedAt > latest)) latest = updatedAt;
  }
  return latest;
}

/**
 * Overview stats. Averages are computed across every (student, enrolled track)
 * pair, so students who enrolled but have not started yet count as 0%.
 */
export function computeOverview({ students, tracks, tasks, resources, progressDocs }) {
  const tasksByTrack = indexBy(tasks, (task) => task.trackId);
  const resourcesByTrack = indexBy(resources, (resource) => resource.trackId);
  const progressByUserTrack = new Map(
    (progressDocs ?? []).map((progress) => [progressKey(progress.userId, progress.trackId), progress]),
  );
  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));

  let totalTasksCompleted = 0;
  let totalSubmissions = 0;
  let percentageSum = 0;
  let percentageCount = 0;

  for (const student of students) {
    for (const trackId of enrolledTrackIds(student)) {
      const track = trackMap.get(trackId);
      if (!track) continue;
      const summary = summarizeTrackProgress({
        track,
        tasksByTrack,
        resourcesByTrack,
        progressByUserTrack,
        userId: student._id,
      });
      totalTasksCompleted += summary.completedTaskIds.length;
      totalSubmissions += summary.taskSubmissions.length;
      percentageSum += summary.percentage;
      percentageCount += 1;
    }
  }

  return {
    totalStudents: students.length,
    studentsByTrack: countStudentsByTrack(students, tracks),
    totalTasksCompleted,
    totalSubmissions,
    averageProgressPercent: percentageCount === 0 ? 0 : Math.round(percentageSum / percentageCount),
  };
}

/**
 * One row of the admin student list: identity, enrolled tracks with per-track
 * progress %, and last activity derived from Progress.updatedAt only.
 */
export function buildStudentRow({ user, tracks, tasks, resources, progressDocs }) {
  const trackMap = new Map(tracks.map((track) => [String(track._id), track]));
  const tasksByTrack = indexBy(tasks, (task) => task.trackId);
  const resourcesByTrack = indexBy(resources, (resource) => resource.trackId);
  const progressByUserTrack = new Map(
    (progressDocs ?? []).map((progress) => [String(progress.trackId), progress]),
  );

  const trackProgress = enrolledTrackIds(user)
    .map((trackId) => trackMap.get(trackId))
    .filter(Boolean)
    .map((track) => {
      const summary = buildProgressSummary(
        track,
        tasksByTrack.get(String(track._id)) ?? [],
        progressByUserTrack.get(String(track._id)) ?? null,
        resourcesByTrack.get(String(track._id)) ?? [],
      );
      return {
        trackId: String(track._id),
        slug: track.slug,
        title: track.title,
        percentage: summary.percentage,
        completedCount: summary.completedCount,
        totalCount: summary.totalCount,
      };
    });

  const overallProgress = trackProgress.length === 0
    ? 0
    : Math.round(trackProgress.reduce((sum, item) => sum + item.percentage, 0) / trackProgress.length);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    branch: user.branch ?? '',
    tracks: trackProgress,
    overallProgress,
    lastActivity: lastActivityFor(progressDocs),
  };
}

/**
 * Full coordinator view of one student: identity, and per enrolled track the
 * week-by-week step breakdown plus submission links with resolved task titles.
 */
export function buildStudentDetail({ user, tracks, tasks, resources, progressDocs }) {
  const taskMap = new Map((tasks ?? []).map((task) => [String(task._id), task]));
  const tasksByTrack = indexBy(tasks, (task) => task.trackId);
  const resourcesByTrack = indexBy(resources, (resource) => resource.trackId);
  const progressByUserTrack = new Map(
    (progressDocs ?? []).map((progress) => [String(progress.trackId), progress]),
  );

  const trackProgress = tracks.map((track) => {
    const trackId = String(track._id);
    const summary = buildProgressSummary(
      track,
      tasksByTrack.get(trackId) ?? [],
      progressByUserTrack.get(trackId) ?? null,
      resourcesByTrack.get(trackId) ?? [],
    );

    const weeks = (track.weeks ?? []).map((week) => {
      const steps = summary.steps
        .filter((step) => step.weekKey === week.weekKey)
        .map((step) => ({ type: step.type, id: step.id, title: step.title, completed: step.completed }));
      return {
        weekKey: week.weekKey,
        number: week.number,
        title: week.title,
        completedCount: steps.filter((step) => step.completed).length,
        totalCount: steps.length,
        steps,
      };
    });

    const submissions = summary.taskSubmissions.map((submission) => {
      const task = taskMap.get(submission.taskId);
      return {
        taskId: submission.taskId,
        taskTitle: task?.title ?? 'Removed task',
        weekKey: task?.weekKey ?? null,
        submissionType: task?.submissionType ?? 'mark-complete',
        // Prefer the current field; fall back to the legacy Figma-only field.
        submissionUrl: submission.submissionUrl ?? submission.figmaUrl ?? null,
        figmaUrl: submission.figmaUrl ?? null,
      };
    });

    return {
      trackId,
      slug: track.slug,
      title: track.title,
      percentage: summary.percentage,
      completedCount: summary.completedCount,
      totalCount: summary.totalCount,
      lastActivity: progressByUserTrack.get(trackId)?.updatedAt ?? null,
      weeks,
      submissions,
    };
  });

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    branch: user.branch ?? '',
    year: user.year ?? null,
    githubUrl: user.githubUrl ?? '',
    portfolioUrl: user.portfolioUrl ?? '',
    createdAt: user.createdAt ?? null,
    tracks: trackProgress,
  };
}
