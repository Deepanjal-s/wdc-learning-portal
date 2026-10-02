import mongoose from 'mongoose';
import Track from '../models/Track.js';
import HttpError from './HttpError.js';

/**
 * Returns the track ObjectIds a user is enrolled in.
 * Prefers the multi-track `selectedTrackIds` array when non-empty;
 * otherwise falls back to the legacy single `selectedTrackId`.
 */
export function getUserTrackIds(user) {
  const multi = Array.isArray(user.selectedTrackIds)
    ? user.selectedTrackIds.filter((id) => id !== null && id !== undefined)
    : [];
  if (multi.length > 0) return multi;
  if (user.selectedTrackId) return [user.selectedTrackId];
  return [];
}

/**
 * Resolves which track a request is operating on.
 * - `requestedTrackId` may be a track id or slug (from query/body); when omitted,
 *   the user's first enrolled track is used (preserves single-track behavior).
 * - The resolved track must be one of the user's enrolled tracks and active.
 */
export async function resolveUserTrack(user, requestedTrackId) {
  const enrolledIds = getUserTrackIds(user).map((id) => String(id));
  if (enrolledIds.length === 0) {
    throw new HttpError(400, 'Choose a learning track in your profile first.');
  }

  let track;
  if (requestedTrackId !== undefined && requestedTrackId !== null && requestedTrackId !== '') {
    const query = mongoose.isValidObjectId(requestedTrackId)
      ? { _id: requestedTrackId }
      : { slug: String(requestedTrackId).trim().toLowerCase() };
    track = await Track.findOne({ ...query, isActive: true });
    if (!track || !enrolledIds.includes(String(track._id))) {
      throw new HttpError(403, 'You are not enrolled in this learning track.');
    }
  } else {
    track = await Track.findOne({ _id: enrolledIds[0], isActive: true });
    if (!track) throw new HttpError(404, 'Your selected learning track is no longer available.');
  }
  return track;
}
