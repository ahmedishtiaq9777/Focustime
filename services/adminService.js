const { s3 } = require("../config/s3");
const {
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const fetchLogsFromS3 = async () => {
  const command = new ListObjectsV2Command({
    Bucket: process.env.BUCKET_NAME_LOG,
    Prefix: "logs/",
  });

  const result = await s3.send(command);

  return result.Contents?.map((file) => ({
    key: file.Key,
    lastModified: file.LastModified,
    size: file.Size,
  }));
};

const getLogFileContent = async (key) => {
  if (!key) throw new Error("File key is required");

  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME_LOG,
    Key: key,
  });
  const data = await s3.send(command);

  return streamToString(data.Body);
};

// Helper to convert stream to string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

const listAllUsers = async () => {
  const { User } = require("../models");
  return User.findAll({ attributes: ["uid", "name", "email", "role"] });
};
module.exports = { fetchLogsFromS3, listAllUsers, getLogFileContent };
