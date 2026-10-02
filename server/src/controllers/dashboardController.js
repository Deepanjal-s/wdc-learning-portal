import Progress from '../models/Progress.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { buildProgressSummary } from '../services/progressService.js';
import { getUserTrackIds } from '../utils/userTracks.js';

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    branch: user.branch ?? '',
    year: user.year ?? null,
    selectedTrackId: user.selectedTrackId ? String(user.selectedTrackId) : null,
    selectedTrackIds: Array.isArray(user.selectedTrackIds)
      ? user.selectedTrackIds.map((id) => String(id))
      : [],
  };
}

async function summarizeTrack(userId, track) {
  const [tasks, resources, progress] = await Promise.all([
    Task.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Resource.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Progress.findOne({ userId, trackId: track._id }).lean(),
  ]);
  return {
    track: { id: String(track._id), slug: track.slug, title: track.title, description: track.description },
    weeks: track.weeks,
    progress: buildProgressSummary(track, tasks, progress, resources),
    tasks,
  };
}

export async function getDashboard(request, response) {
  const user = serializeUser(request.user);
  const tracks = await Track.find({ isActive: true }).select('slug title description').sort({ title: 1 }).lean();
  const now = new Date();
  const rounds = await RecruitmentRound.find({
    status: { $ne: 'draft' },
    $or: [{ releaseDateTime: null }, { releaseDateTime: { $lte: now } }],
  }).select('roundNumber title description status releaseDateTime deadline').sort({ roundNumber: 1 }).lean();

  const enrolledIds = getUserTrackIds(request.user);
  const summaries = [];
  for (const trackId of enrolledIds) {
    const track = await Track.findOne({ _id: trackId, isActive: true });
    if (track) summaries.push(await summarizeTrack(request.user._id, track));
  }

  if (summaries.length === 0) {
    return response.json({ user, tracks, track: null, progress: null, currentTask: null, upcomingRounds: rounds, trackProgress: [] });
  }

  // Primary track drives the existing single-track response shape: an explicitly
  // requested (and enrolled) ?trackId= wins, otherwise the first enrolled track.
  let primary = summaries[0];
  if (request.query.trackId) {
    const requested = String(request.query.trackId).trim().toLowerCase();
    const match = summaries.find((item) => item.track.id === requested || item.track.slug === requested);
    if (match) primary = match;
  }

  const summary = primary.progress;
  const incompleteTaskIds = new Set(summary.completedTaskIds);
  const nextTask = primary.tasks.find((task) => !incompleteTaskIds.has(String(task._id)) && (!summary.currentWeek || task.weekKey === summary.currentWeek.weekKey))
    ?? primary.tasks.find((task) => !incompleteTaskIds.has(String(task._id)))
    ?? null;
  const week = summary.currentWeek;
  const currentGoals = week ? primary.weeks.find((item) => item.weekKey === week.weekKey)?.topics ?? [] : [];

  return response.json({
    user,
    tracks,
    track: primary.track,
    progress: summary,
    currentGoals: currentGoals.map((topic) => ({ ...(typeof topic.toObject === 'function' ? topic.toObject() : topic), completed: summary.completedTopicKeys.includes(topic.topicKey) })),
    currentTask: nextTask,
    upcomingRounds: rounds,
    trackProgress: summaries.map((item) => ({ track: item.track, progress: item.progress })),
  });
}
