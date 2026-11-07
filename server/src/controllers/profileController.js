import mongoose from 'mongoose';
import Track from '../models/Track.js';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';
import { getUserTrackIds } from '../utils/userTracks.js';

function publicUser(user) {
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
    githubUrl: user.githubUrl ?? '',
    portfolioUrl: user.portfolioUrl ?? '',
    role: user.role,
  };
}

export function getProfile(request, response) {
  return response.json({ user: publicUser(request.user) });
}

export async function updateProfile(request, response) {
  const { name, branch, year, githubUrl, portfolioUrl, selectedTrackId, selectedTrackIds } = request.body;
  const allowedFields = ['name', 'branch', 'year', 'githubUrl', 'portfolioUrl', 'selectedTrackId', 'selectedTrackIds'];
  const updates = {};

  for (const field of allowedFields) {
    if (Object.hasOwn(request.body, field)) updates[field] = request.body[field];
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    throw new HttpError(400, 'Name must contain at least 2 characters.');
  }
  if (year !== undefined && year !== null && (!Number.isInteger(Number(year)) || Number(year) !== 2)) {
    throw new HttpError(400, 'Only second-year students can use this portal.');
  }
  // Track enrollment is additive-only: saving the profile can add tracks but
  // never drops an enrolled track (or its progress). Track removal, when the
  // coordinators need it, will live in the admin dashboard.
  const alreadyEnrolled = getUserTrackIds(request.user).map((id) => String(id));
  if (selectedTrackId !== undefined && selectedTrackIds === undefined) {
    const track = await Track.findOne({ _id: selectedTrackId, isActive: true }).select('_id');
    if (!track) throw new HttpError(404, 'Selected learning track was not found.');
    const merged = [...new Set([...alreadyEnrolled, String(track._id)])];
    updates.selectedTrackIds = merged.map((id) => new mongoose.Types.ObjectId(id));
    // Honor the requested track as the active one; enrollment stays additive.
    updates.selectedTrackId = track._id;
  }
  if (selectedTrackIds !== undefined) {
    if (!Array.isArray(selectedTrackIds) || selectedTrackIds.length === 0) {
      throw new HttpError(400, 'Select at least one learning track.');
    }
    const ids = [...new Set([...alreadyEnrolled, ...selectedTrackIds.map((id) => String(id))])];
    if (!ids.every((id) => mongoose.isValidObjectId(id))) {
      throw new HttpError(400, 'One or more learning track ids are invalid.');
    }
    const found = await Track.find({ _id: { $in: ids }, isActive: true }).select('_id');
    if (found.length !== ids.length) throw new HttpError(404, 'One or more selected learning tracks were not found.');
    const byId = new Map(found.map((track) => [String(track._id), track._id]));
    updates.selectedTrackIds = ids.map((id) => byId.get(id));
    updates.selectedTrackId = updates.selectedTrackIds[0];
  }

  if (typeof updates.name === 'string') updates.name = updates.name.trim();
  if (typeof updates.branch === 'string') updates.branch = updates.branch.trim().slice(0, 80);
  for (const field of ['githubUrl', 'portfolioUrl']) {
    if (typeof updates[field] === 'string' && updates[field].length > 500) {
      throw new HttpError(400, `${field} must be 500 characters or fewer.`);
    }
  }

  Object.assign(request.user, updates);
  await request.user.save();
  return response.json({ user: publicUser(request.user) });
}

/**
 * Adds one learning track to the student's enrollment (POST /api/student/profile/tracks,
 * body `{ slug }`). Additive only: the track is appended with `$addToSet`, never
 * replaces or removes existing enrollment, and never touches progress documents.
 * The legacy `selectedTrackId` keeps pointing at the first enrolled track.
 */
export async function addTrack(request, response) {
  const { slug } = request.body ?? {};
  if (typeof slug !== 'string' || slug.trim().length === 0) {
    throw new HttpError(400, 'Provide the slug of the learning track to add.');
  }
  const track = await Track.findOne({ slug: slug.trim().toLowerCase(), isActive: true }).select('_id slug title');
  if (!track) throw new HttpError(400, 'That learning track is not available.');

  const enrolledIds = getUserTrackIds(request.user).map((id) => String(id));
  if (!enrolledIds.includes(String(track._id))) enrolledIds.push(String(track._id));

  const user = await User.findByIdAndUpdate(
    request.user._id,
    {
      $addToSet: { selectedTrackIds: track._id },
      $set: { selectedTrackId: new mongoose.Types.ObjectId(enrolledIds[0]) },
    },
    { new: true },
  );
  if (!user) throw new HttpError(404, 'Your account was not found.');

  return response.json({
    user: publicUser(user),
    addedTrack: { id: String(track._id), slug: track.slug, title: track.title },
  });
}
