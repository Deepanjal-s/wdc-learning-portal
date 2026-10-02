// Helpers for the multi-track student model.
//
// A student is *assigned* to one or more tracks (user.selectedTrackIds) and
// has one *active* track (user.selectedTrackId) whose roadmap, resources,
// tasks, and progress are shown. getAssignedTrackIds falls back to the legacy
// single selectedTrackId so users created before selectedTrackIds existed keep
// working even before the migration script runs.

export function getAssignedTrackIds(user) {
  const explicit = (user?.selectedTrackIds ?? []).map((id) => String(id)).filter(Boolean);
  if (explicit.length > 0) return explicit;
  if (user?.selectedTrackId) return [String(user.selectedTrackId)];
  return [];
}

export function isAssignedToTrack(user, trackId) {
  if (!trackId) return false;
  return getAssignedTrackIds(user).includes(String(trackId));
}
