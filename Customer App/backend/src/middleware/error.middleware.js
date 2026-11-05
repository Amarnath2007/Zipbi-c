/**
 * Global Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

