/**
 * Express error-handling middleware.
 *
 * Convert any thrown error into a JSON response with the standard envelope:
 *   { success: false, message: string, data?: any }
 */
function notFound(req, res, _next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  // PG errors often expose details we don't want to leak; map common codes.
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({
    success: false,
    message: err.expose ? err.message : status >= 500 ? 'Internal server error' : err.message,
  });
}

/**
 * Wrap an async route handler so thrown errors propagate to errorHandler.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Build an Error with an HTTP status code and a public message.
 */
function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  e.expose = true;
  return e;
}

module.exports = { notFound, errorHandler, asyncHandler, httpError };
