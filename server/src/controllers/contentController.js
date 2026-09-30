import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import { buildProgressSummary } from '../services/progressService.js';
import HttpError from '../utils/HttpError.js';

async function findTrack(identifier) {
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  const track = await Track.findOne({ ...query, isActive: true });
  if (!track) throw new HttpError(404, 'Learning track was not found.');
  return track;
}

export async function listTracks(_request, response) {
  const tracks = await Track.find({ isActive: true }).select('slug title description weeks createdAt').sort({ title: 1 });
  return response.json({ tracks });
}

export async function getTrack(request, response) {
  return response.json({ track: await findTrack(request.params.trackId) });
}

export async function getRoadmap(request, response) {
  const track = await findTrack(request.params.trackId);
  const [resources, tasks, progress] = await Promise.all([
    Resource.find({ trackId: track._id, isPublished: true }).select('slug title weekKey topicKey type url').lean(),
    Task.find({ trackId: track._id, isPublished: true }).select('slug title weekKey difficulty estimatedMinutes').sort({ createdAt: 1 }).lean(),
    Progress.findOne({ userId: request.user._id, trackId: track._id }).lean(),
  ]);
  const summary = buildProgressSummary(track, tasks, progress, resources);
  const weeks = track.weeks.map((week) => ({
    ...week.toObject(),
    topics: week.topics.map((topic) => ({
      ...topic.toObject(),
      completed: summary.completedTopicKeys.includes(topic.topicKey),
      resources: resources.filter((resource) => resource.weekKey === week.weekKey && resource.topicKey === topic.topicKey),
    })),
    weekResources: resources.filter((resource) => resource.weekKey === week.weekKey && !resource.topicKey),
    tasks: tasks.filter((task) => task.weekKey === week.weekKey),
  }));

  return response.json({ track: { id: String(track._id), slug: track.slug, title: track.title }, weeks, progress: summary });
}

export async function listResources(request, response) {
  const query = { isPublished: true };
  if (request.query.trackId) {
    const track = await findTrack(request.query.trackId);
    query.trackId = track._id;
  }
  for (const field of ['weekKey', 'topicKey', 'type']) {
    if (typeof request.query[field] === 'string') query[field] = request.query[field];
  }
  const resources = await Resource.find(query).populate('trackId', 'slug title').sort({ weekKey: 1, title: 1 }).lean();
  return response.json({ resources });
}

export async function getResource(request, response) {
  const resource = await Resource.findOne({ _id: request.params.id, isPublished: true }).populate('trackId', 'slug title');
  if (!resource) throw new HttpError(404, 'Resource was not found.');
  return response.json({ resource });
}

export async function listTasks(request, response) {
  const query = { isPublished: true };
  if (request.query.trackId) {
    const track = await findTrack(request.query.trackId);
    query.trackId = track._id;
  }
  if (typeof request.query.weekKey === 'string') query.weekKey = request.query.weekKey;
  if (request.query.roundNumber) {
    const round = await RecruitmentRound.findOne({ roundNumber: Number(request.query.roundNumber), status: { $ne: 'draft' } });
    if (!round) return response.json({ tasks: [] });
    query._id = { $in: round.taskIds };
  }
  const tasks = await Task.find(query).populate('trackId', 'slug title').sort({ weekKey: 1, title: 1 }).lean();
  return response.json({ tasks });
}

export async function getTask(request, response) {
  const task = await Task.findOne({ _id: request.params.id, isPublished: true }).populate('trackId', 'slug title');
  if (!task) throw new HttpError(404, 'Task was not found.');
  return response.json({ task });
}

export async function listRecruitmentRounds(_request, response) {
  const now = new Date();
  const rounds = await RecruitmentRound.find({
    status: { $ne: 'draft' },
    $or: [{ releaseDateTime: null }, { releaseDateTime: { $lte: now } }],
  })
    .populate('trackIds', 'slug title')
    .populate({ path: 'resourceIds', match: { isPublished: true }, select: 'slug title description url type weekKey' })
    .populate({ path: 'taskIds', match: { isPublished: true }, select: 'slug title description instructions difficulty estimatedMinutes deadline referenceImageUrl submissionType evaluationCriteria' })
    .sort({ roundNumber: 1 });
  return response.json({ rounds });
}

export async function getRecruitmentRound(request, response) {
  const now = new Date();
  const round = await RecruitmentRound.findOne({
    roundNumber: Number(request.params.roundNumber),
    status: { $ne: 'draft' },
    $or: [{ releaseDateTime: null }, { releaseDateTime: { $lte: now } }],
  })
    .populate('trackIds', 'slug title')
    .populate({ path: 'resourceIds', match: { isPublished: true }, select: 'slug title description url type weekKey' })
    .populate({ path: 'taskIds', match: { isPublished: true }, select: 'slug title description instructions difficulty estimatedMinutes deadline referenceImageUrl submissionType evaluationCriteria' });
  if (!round) throw new HttpError(404, 'Recruitment round was not found.');
  return response.json({ round });
}

export { findTrack };
