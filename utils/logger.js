const winston = require("winston");
const { s3 } = require("../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

// const s3 = new S3Client({
//   region: process.env.AWS_REGION || "us-east-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// Local file transport
const fileTransport = new winston.transports.File({
  filename: "logs/errors.log",
  level: "error",
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.simple(),
});

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [fileTransport, consoleTransport],
});

// Custom S3 log uploader
async function uploadLogToS3(message) {
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME_LOG,
      Key: `logs/${new Date().toISOString().split("T")[0]}/${uuidv4()}.log`,
      Body: message,
      ContentType: "text/plain",
    };

    await s3.send(new PutObjectCommand(params));
  } catch (err) {
    console.error("❌ Failed to upload log to S3:", err);
  }
}

// Hook into logger.error
const originalError = logger.error.bind(logger);
logger.error = (message, meta) => {
  const logMessage =
    typeof message === "string" ? message : JSON.stringify(message, null, 2);

  originalError(logMessage, meta);
  uploadLogToS3(logMessage);
};

module.exports = logger;
