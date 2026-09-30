import mongoose from 'mongoose';
import RecruitmentRound from '../models/RecruitmentRound.js';
import Resource from '../models/Resource.js';
import Task from '../models/Task.js';
import Track from '../models/Track.js';
import HttpError from '../utils/HttpError.js';

const contentModels = {
  tracks: { model: Track, fields: ['slug', 'title', 'description', 'isActive', 'weeks'] },
  resources: { model: Resource, fields: ['slug', 'title', 'description', 'url', 'type', 'trackId', 'weekKey', 'topicKey', 'difficulty', 'estimatedMinutes', 'isPublished'] },
  tasks: { model: Task, fields: ['slug', 'title', 'description', 'instructions', 'trackId', 'weekKey', 'roundId', 'difficulty', 'estimatedMinutes', 'deadline', 'referenceImageUrl', 'submissionType', 'evaluationCriteria', 'isPublished'] },
  rounds: { model: RecruitmentRound, fields: ['roundNumber', 'title', 'description', 'trackIds', 'requirements', 'resourceIds', 'taskIds', 'deadline', 'submissionInstructions', 'evaluationCriteria', 'status'] },
};

function modelFor(type) {
  const definition = contentModels[type];
  if (!definition) throw new HttpError(404, 'Content type was not found.');
  return definition;
}

function pickFields(body, fields) {
  return Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
}

function findQuery(type, identifier) {
  if (type === 'rounds') {
    const roundNumber = Number(identifier);
    if (!Number.isInteger(roundNumber) || roundNumber < 1) throw new HttpError(400, 'Round number must be a positive integer.');
    return { roundNumber };
  }
  if (!mongoose.isValidObjectId(identifier)) throw new HttpError(400, 'Content id is invalid.');
  return { _id: identifier };
}

export async function getAdminContent(_request, response) {
  const [tracks, resources, tasks, rounds] = await Promise.all([
    Track.find().sort({ title: 1 }).lean(),
    Resource.find().populate('trackId', 'slug title').sort({ updatedAt: -1 }).lean(),
    Task.find().populate('trackId', 'slug title').sort({ updatedAt: -1 }).lean(),
    RecruitmentRound.find().sort({ roundNumber: 1 }).lean(),
  ]);
  return response.json({ tracks, resources, tasks, rounds });
}

export async function upsertContent(request, response) {
  const type = request.params.type;
  const definition = modelFor(type);
  const identifier = request.params.id;
  const payload = pickFields(request.body, definition.fields);
  if (Object.keys(payload).length === 0) throw new HttpError(400, 'Provide at least one supported content field.');

  let query;
  if (identifier) {
    query = findQuery(type, identifier);
  } else if (type === 'rounds' && Number.isInteger(Number(payload.roundNumber)) && Number(payload.roundNumber) > 0) {
    query = { roundNumber: Number(payload.roundNumber) };
  } else if (type !== 'rounds' && typeof payload.slug === 'string' && payload.slug.trim()) {
    query = { slug: payload.slug.trim().toLowerCase() };
  } else {
    throw new HttpError(400, type === 'rounds' ? 'A positive roundNumber is required.' : 'A slug is required.');
  }

  const document = await definition.model.findOneAndUpdate(
    query,
    { $set: payload },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  return response.json({ [type.slice(0, -1)]: document });
}

export async function deleteContent(request, response) {
  const { model } = modelFor(request.params.type);
  const result = await model.deleteOne(findQuery(request.params.type, request.params.id));
  if (!result.deletedCount) throw new HttpError(404, 'Content item was not found.');
  return response.json({ message: 'Content item deleted.' });
}
