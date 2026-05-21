// This function catches any error thrown anywhere in your app
// and sends back a clean, consistent response instead of crashing

const errorHandler = (err, req, res, next) => {
  // Log the error on the server so you can debug it
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    // Only show detailed error info during development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;