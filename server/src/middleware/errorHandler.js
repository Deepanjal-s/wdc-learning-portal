export default function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ message: 'Request body contains invalid JSON.' });
  }

  if (error.code === 11000) {
    return response.status(409).json({ message: 'An account with this email already exists.' });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ message: 'One or more supplied values are invalid.' });
  }

  const statusCode = error.statusCode || error.status || 500;
  if (statusCode >= 500) console.error('Unhandled API error:', error.message);
  return response.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error.' : error.message,
  });
}
