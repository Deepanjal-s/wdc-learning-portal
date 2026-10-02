import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { buildProgressSummary, isValidFigmaUrl, isWeekUnlocked } from '../services/progressService.js';
import { isAssignedToTrack } from '../utils/trackAccess.js';
import HttpError from '../utils/HttpError.js';

async function getSelectedTrack(user) {
  if (!user.selectedTrackId) throw new HttpError(400, 'Choose a learning track in your profile first.');
  const track = await Track.findOne({ _id: user.selectedTrackId, isActive: true });
  if (!track) throw new HttpError(404, 'Your selected learning track is no longer available.');
  if (!isAssignedToTrack(user, track._id)) throw new HttpError(403, 'You are not assigned to this learning track.');
  return track;
}

export async function getProgress(request, response) {
  const track = await getSelectedTrack(request.user);
  const [tasks, resources, progress] = await Promise.all([
    Task.find({ trackId: track._id, isPublished: true }).sort({ createdAt: 1 }).lean(),
    Resource.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Progress.findOne({ userId: request.user._id, trackId: track._id }).lean(),
  ]);
  return response.json({ progress: buildProgressSummary(track, tasks, progress, resources) });
}

function assertWeekUnlocked(track, summary, weekKey) {
  if (!isWeekUnlocked(track, summary, weekKey)) {
    throw new HttpError(403, 'Complete the previous week before accessing the next one.');
  }
}

export async function completeItem(request, response) {
  const track = await getSelectedTrack(request.user);
  const { type, id, completed = true } = request.body;
  const { figmaUrl, submitOnly = false } = request.body;
  if (!['topic', 'resource', 'task'].includes(type) || typeof id !== 'string' || id.length > 120) {
    throw new HttpError(400, 'Provide a valid completion type and item id.');
  }
  if (typeof completed !== 'boolean') throw new HttpError(400, 'The completed value must be true or false.');

  const [tasks, resources, progress] = await Promise.all([
    Task.find({ trackId: track._id, isPublished: true }).sort({ createdAt: 1 }).lean(),
    Resource.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Progress.findOne({ userId: request.user._id, trackId: track._id }).lean(),
  ]);
  const summary = buildProgressSummary(track, tasks, progress, resources);

  let update;
  if (type === 'topic') {
    const topicExists = track.weeks.some((week) => week.topics.some((topic) => topic.topicKey === id));
    if (!topicExists) throw new HttpError(404, 'Topic was not found in your selected track.');
    const week = track.weeks.find((item) => item.topics.some((topic) => topic.topicKey === id));
    assertWeekUnlocked(track, summary, week.weekKey);
    update = completed ? { $addToSet: { completedTopicKeys: id } } : { $pull: { completedTopicKeys: id } };
  } else if (type === 'resource') {
    const resource = await Resource.findOne({ _id: id, trackId: track._id, isPublished: true }).select('_id weekKey');
    if (!resource) throw new HttpError(404, 'Resource was not found in your selected track.');
    assertWeekUnlocked(track, summary, resource.weekKey);
    update = completed ? { $addToSet: { completedResourceIds: resource._id } } : { $pull: { completedResourceIds: resource._id } };
  } else {
    const task = await Task.findOne({ _id: id, trackId: track._id, isPublished: true }).select('_id weekKey roundId');
    if (!task) throw new HttpError(404, 'Task was not found in your selected track.');
    assertWeekUnlocked(track, summary, task.weekKey);

    const isWeeklyTask = Boolean(task.weekKey && !task.roundId && track.weeks.some((week) => week.weekKey === task.weekKey));
    // The Figma-link submission gate is a UI/UX-track requirement. Weekly
    // tasks on other tracks (e.g. Technical) complete with a plain
    // mark-complete, exactly like non-weekly tasks do today.
    const isDesignLinkTask = isWeeklyTask && track.slug === 'ui-ux';
    const existingSubmission = (progress?.taskSubmissions ?? []).find((submission) => String(submission.taskId) === String(task._id));

    if (submitOnly) {
      if (!isDesignLinkTask) throw new HttpError(400, 'Figma links are only required for weekly learning tasks.');
      if (!isValidFigmaUrl(figmaUrl)) throw new HttpError(400, 'Please enter a valid Figma link.');

      const taskSubmissions = [...(progress?.taskSubmissions ?? [])];
      const submissionIndex = taskSubmissions.findIndex((submission) => String(submission.taskId) === String(task._id));
      const submission = { taskId: task._id, figmaUrl: figmaUrl.trim() };
      if (submissionIndex >= 0) taskSubmissions[submissionIndex] = submission;
      else taskSubmissions.push(submission);

      await Progress.findOneAndUpdate(
        { userId: request.user._id, trackId: track._id },
        { $set: { taskSubmissions }, $setOnInsert: { userId: request.user._id, trackId: track._id } },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
      );
      return getProgress(request, response);
    }

    if (isDesignLinkTask && completed) {
      if (figmaUrl !== undefined && !isValidFigmaUrl(figmaUrl)) {
        throw new HttpError(400, 'Please enter a valid Figma link.');
      }
      const submittedUrl = typeof figmaUrl === 'string' ? figmaUrl.trim() : existingSubmission?.figmaUrl;
      if (!isValidFigmaUrl(submittedUrl)) {
        throw new HttpError(400, 'Submit a valid Figma link before completing this task.');
      }

      if (typeof figmaUrl === 'string') {
        const taskSubmissions = [...(progress?.taskSubmissions ?? [])];
        const submissionIndex = taskSubmissions.findIndex((submission) => String(submission.taskId) === String(task._id));
        const submission = { taskId: task._id, figmaUrl: submittedUrl };
        if (submissionIndex >= 0) taskSubmissions[submissionIndex] = submission;
        else taskSubmissions.push(submission);
        update = {
          $addToSet: { completedTaskIds: task._id },
          $set: { taskSubmissions },
        };
      } else {
        update = { $addToSet: { completedTaskIds: task._id } };
      }
    } else {
      update = completed
        ? { $addToSet: { completedTaskIds: task._id } }
        : { $pull: { completedTaskIds: task._id } };
    }
  }

  await Progress.findOneAndUpdate(
    { userId: request.user._id, trackId: track._id },
    { ...update, $setOnInsert: { userId: request.user._id, trackId: track._id } },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  return getProgress(request, response);
}
