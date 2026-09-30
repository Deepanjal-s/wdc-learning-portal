import Progress from '../models/Progress.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { buildProgressSummary } from '../services/progressService.js';

function serializeUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, branch: user.branch ?? '', year: user.year ?? null, selectedTrackId: user.selectedTrackId ? String(user.selectedTrackId) : null };
}

export async function getDashboard(request, response) {
  const user = serializeUser(request.user);
  const tracks = await Track.find({ isActive: true }).select('slug title description').sort({ title: 1 }).lean();
  const track = request.user.selectedTrackId ? await Track.findOne({ _id: request.user.selectedTrackId, isActive: true }) : null;
  const rounds = await RecruitmentRound.find({ status: { $ne: 'draft' } }).select('roundNumber title description status deadline').sort({ roundNumber: 1 }).lean();

  if (!track) return response.json({ user, tracks, track: null, progress: null, currentTask: null, upcomingRounds: rounds });

  const [tasks, resources, progress] = await Promise.all([
    Task.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Resource.find({ trackId: track._id, isPublished: true }).sort({ weekKey: 1, title: 1 }).lean(),
    Progress.findOne({ userId: request.user._id, trackId: track._id }).lean(),
  ]);
  const summary = buildProgressSummary(track, tasks, progress, resources);
  const incompleteTaskIds = new Set(summary.completedTaskIds);
  const nextTask = tasks.find((task) => !incompleteTaskIds.has(String(task._id)) && (!summary.currentWeek || task.weekKey === summary.currentWeek.weekKey))
    ?? tasks.find((task) => !incompleteTaskIds.has(String(task._id)))
    ?? null;
  const week = summary.currentWeek;
  const currentGoals = week ? track.weeks.find((item) => item.weekKey === week.weekKey)?.topics ?? [] : [];

  return response.json({
    user,
    tracks,
    track: { id: String(track._id), slug: track.slug, title: track.title, description: track.description },
    progress: summary,
    currentGoals: currentGoals.map((topic) => ({ ...topic.toObject(), completed: summary.completedTopicKeys.includes(topic.topicKey) })),
    currentTask: nextTask,
    upcomingRounds: rounds,
  });
}
