import Track from '../models/Track.js';
import HttpError from '../utils/HttpError.js';

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    branch: user.branch ?? '',
    year: user.year ?? null,
    selectedTrackId: user.selectedTrackId ? String(user.selectedTrackId) : null,
    githubUrl: user.githubUrl ?? '',
    portfolioUrl: user.portfolioUrl ?? '',
    role: user.role,
  };
}

export function getProfile(request, response) {
  return response.json({ user: publicUser(request.user) });
}

export async function updateProfile(request, response) {
  const { name, branch, year, githubUrl, portfolioUrl, selectedTrackId } = request.body;
  const allowedFields = ['name', 'branch', 'year', 'githubUrl', 'portfolioUrl', 'selectedTrackId'];
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
  if (selectedTrackId !== undefined) {
    const track = await Track.findOne({ _id: selectedTrackId, isActive: true }).select('_id');
    if (!track) throw new HttpError(404, 'Selected learning track was not found.');
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
