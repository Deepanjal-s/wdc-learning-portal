import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Populates `request.user` when a valid session cookie is present, but unlike
 * requireAuth it never rejects anonymous callers. Used on endpoints that are
 * public in general but gate specific filters (e.g. ?trackId=) by enrollment.
 */
export async function optionalAuth(request, _response, next) {
  try {
    const token = request.cookies?.wdc_session;
    if (!token || !process.env.JWT_SECRET) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (user) request.user = user;
    return next();
  } catch {
    return next();
  }
}
