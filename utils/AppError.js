class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // call parent Error constructor
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
