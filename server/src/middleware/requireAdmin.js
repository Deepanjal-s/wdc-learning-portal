import HttpError from '../utils/HttpError.js';

export function requireAdmin(request, _response, next) {
  if (request.user?.role !== 'admin') {
    return next(new HttpError(403, 'WDC senior/admin access is required.'));
  }
  return next();
}
