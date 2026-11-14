import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import { buildProgressSummary, isValidFigmaUrl, isValidHttpsUrl, isWeekUnlocked } from '../services/progressService.js';
import { resolveUserTrack } from '../utils/userTracks.js';
import HttpError from '../utils/HttpError.js';

export async function getProgress(request, response) {
  const track = await resolveUserTrack(request.user, request.query.trackId);
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
  const track = await resolveUserTrack(request.user, request.query.trackId || request.body.trackId);
  const { type, id, completed = true } = request.body;
  const { figmaUrl, submissionUrl, submitOnly = false } = request.body;
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
    const task = await Task.findOne({ _id: id, trackId: track._id, isPublished: true }).select('_id weekKey roundId submissionType');
    if (!task) throw new HttpError(404, 'Task was not found in your selected track.');
    assertWeekUnlocked(track, summary, task.weekKey);

    // The submission gate keys off the task's submissionType. The UI/UX weekly
    // tasks are seeded as 'design-link' (see uiuxSeed.js), so their existing
    // Figma-link requirement is preserved exactly.
    const submissionType = task.submissionType || 'mark-complete';
    const requiresFigmaLink = submissionType === 'design-link';
    const requiresCodeLink = submissionType === 'code-link';
    const requiresLink = requiresFigmaLink || requiresCodeLink;
    const existingSubmission = (progress?.taskSubmissions ?? []).find((submission) => String(submission.taskId) === String(task._id));
    const existingUrl = existingSubmission?.submissionUrl || existingSubmission?.figmaUrl;

    const validateLink = (rawUrl) => (requiresFigmaLink ? isValidFigmaUrl(rawUrl) : isValidHttpsUrl(rawUrl));
    const invalidLinkMessage = requiresFigmaLink
      ? 'Please enter a valid Figma link.'
      : 'Please enter a valid link starting with https://.';

    const upsertSubmission = (url) => {
      const taskSubmissions = [...(progress?.taskSubmissions ?? [])];
      const submissionIndex = taskSubmissions.findIndex((submission) => String(submission.taskId) === String(task._id));
      const submission = requiresFigmaLink
        ? { taskId: task._id, figmaUrl: url }
        : { taskId: task._id, submissionUrl: url };
      if (submissionIndex >= 0) taskSubmissions[submissionIndex] = submission;
      else taskSubmissions.push(submission);
      return taskSubmissions;
    };

    if (submitOnly) {
      if (!requiresLink) throw new HttpError(400, 'This task does not require a submission link.');
      const rawUrl = requiresFigmaLink ? figmaUrl : submissionUrl;
      if (!validateLink(rawUrl)) throw new HttpError(400, invalidLinkMessage);

      await Progress.findOneAndUpdate(
        { userId: request.user._id, trackId: track._id },
        { $set: { taskSubmissions: upsertSubmission(rawUrl.trim()) }, $setOnInsert: { userId: request.user._id, trackId: track._id } },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
      );
      return getProgress(request, response);
    }

    if (requiresLink && completed) {
      const rawUrl = requiresFigmaLink ? figmaUrl : submissionUrl;
      if (rawUrl !== undefined && !validateLink(rawUrl)) {
        throw new HttpError(400, invalidLinkMessage);
      }
      const submittedUrl = typeof rawUrl === 'string' ? rawUrl.trim() : existingUrl;
      if (!validateLink(submittedUrl)) {
        throw new HttpError(400, requiresFigmaLink ? 'Submit a valid Figma link before completing this task.' : 'Submit a valid link before completing this task.');
      }

      if (typeof rawUrl === 'string') {
        update = {
          $addToSet: { completedTaskIds: task._id },
          $set: { taskSubmissions: upsertSubmission(submittedUrl) },
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
