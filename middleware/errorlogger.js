const logger = require("../utils/logger");
const safeBody = require("../utils/safeBody");

function errorLogger(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    status: err.status,
    body: safeBody(req.body),
  });

  let status = err.status || 500;
  let message = status === 500 ? "Internal Server Error" : err.message;

  res.status(status).json({ error: message });
}

module.exports = errorLogger;
