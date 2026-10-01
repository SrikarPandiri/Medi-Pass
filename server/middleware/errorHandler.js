/**
 * @file server/middleware/errorHandler.js
 * @description Centralized Express error handler returning uniform JSON responses:
 * { error: { code, message } }
 */

export function errorHandler(err, req, res, next) {
  console.error('[API Error]', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR');

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'An unexpected server error occurred.'
    }
  });
}

export default errorHandler;
