import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Track from '../models/Track.js';
import { getAssignedTrackIds } from '../utils/trackAccess.js';
import HttpError from '../utils/HttpError.js';

const COOKIE_NAME = 'wdc_session';

function cookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    branch: user.branch ?? '',
    year: user.year ?? null,
    selectedTrackId: user.selectedTrackId ? String(user.selectedTrackId) : null,
    selectedTrackIds: getAssignedTrackIds(user),
    githubUrl: user.githubUrl ?? '',
    portfolioUrl: user.portfolioUrl ?? '',
    role: user.role,
  };
}

function issueSession(response, user) {
  const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  response.cookie(COOKIE_NAME, token, cookieOptions());
  return publicUser(user);
}

export async function register(request, response) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new HttpError(503, 'Authentication is not configured. Set a JWT_SECRET of at least 32 characters.');
  }

  const { name, email, password, branch, year } = request.body;
  if (typeof name !== 'string' || name.trim().length < 2) {
    throw new HttpError(400, 'Name must contain at least 2 characters.');
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must contain at least 8 characters.');
  }
  if (year === undefined || year === '' || !Number.isInteger(Number(year)) || Number(year) !== 2) {
    throw new HttpError(400, 'Only second-year students can register for this program.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Track choice at registration: 'ui-ux' | 'technical' | 'both'.
  // Defaults to UI/UX so older clients keep working unchanged.
  const trackChoice = typeof request.body.trackChoice === 'string' ? request.body.trackChoice : 'ui-ux';
  const choiceSlugs = { 'ui-ux': ['ui-ux'], technical: ['technical'], both: ['ui-ux', 'technical'] }[trackChoice];
  if (!choiceSlugs) throw new HttpError(400, 'Choose a valid learning track option.');
  const assignedTracks = await Track.find({ slug: { $in: choiceSlugs }, isActive: true }).select('_id slug').lean();
  if (assignedTracks.length !== choiceSlugs.length) {
    throw new HttpError(400, 'The selected learning track is not available right now.');
  }
  const orderedTracks = choiceSlugs.map((slug) => assignedTracks.find((track) => track.slug === slug));

  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    branch: typeof branch === 'string' ? branch.trim().slice(0, 80) : undefined,
    year: 2,
    selectedTrackIds: orderedTracks.map((track) => track._id),
    selectedTrackId: orderedTracks[0]._id,
  });

  return response.status(201).json({ user: issueSession(response, user) });
}

export async function login(request, response) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new HttpError(503, 'Authentication is not configured. Set a JWT_SECRET of at least 32 characters.');
  }

  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body.password;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }

  return response.json({ user: issueSession(response, user) });
}

export function logout(_request, response) {
  response.clearCookie(COOKIE_NAME, cookieOptions());
  return response.json({ message: 'You have been logged out.' });
}

export function currentUser(request, response) {
  return response.json({ user: publicUser(request.user) });
}
