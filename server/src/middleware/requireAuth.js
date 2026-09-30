import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import HttpError from '../utils/HttpError.js';

export async function requireAuth(request, _response, next) {
  try {
    const token = request.cookies?.wdc_session;
    if (!token) throw new HttpError(401, 'Please log in to continue.');
    if (!process.env.JWT_SECRET) throw new HttpError(500, 'Authentication is not configured.');

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, 'Your session is no longer valid. Please log in again.');

    request.user = user;
    return next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Your session has expired. Please log in again.'));
    }
    return next(error);
  }
}
