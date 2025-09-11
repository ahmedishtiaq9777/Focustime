const { s3 } = require("../config/s3");
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

/**
 * Upload file to S3
 */
async function uploadTaskImage(fileBuffer, fileName, bucketName, contentType) {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(params);
  await s3.send(command);
  return fileName;
}

/**
 * Generate signed URL for task image
 */
async function getTaskImageUrl(fileName, bucketName) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

module.exports = { uploadTaskImage, getTaskImageUrl };
