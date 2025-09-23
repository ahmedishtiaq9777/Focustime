const {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByUser,
  countTasks,
  getTaskPagination,
  getUpcomingTasks,
  getImportantTasks,
} = require("../repositories/taskRepository");
const { s3 } = require("../config/s3"); // your initialized S3 client
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  createAndScheduleNotification,
} = require("../services/notificationservice");
const { Op } = require("sequelize");

const { uploadTaskImage, getTaskImageUrl } = require("../utils/s3helpers");

const bucketName = process.env.BUCKET_NAME;

/**
 * Create a new task
 */
async function createTaskService(data, file) {
  let imageName = null;

  if (file) {
    imageName = `${Date.now()}-${file.originalname}`;
    await uploadTaskImage(file.buffer, imageName, bucketName, file.mimetype);
  }

  const task = await createTask(
    data.title,
    data.user_id,
    data.scheduled_for,
    data.priority,
    data.description,
    data.status,
    imageName
  );
  // Create notification for this task
  await createAndScheduleNotification(task, data.user_id);

  return task;
}

async function getTasksWithSearch(userId, search = "") {
  // Build where clause
  const whereClause = { user_id: userId };
  if (search.trim()) {
    whereClause.title = { [Op.like]: `%${search.trim()}%` };
  }

  // Fetch tasks from DB
  const tasks = await getTasksByUser(whereClause);

  // Generate S3 signed URLs for task images
  for (const task of tasks) {
    if (task.image_url) {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: task.image_url,
      });
      task.image_url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }
  }

  return tasks;
}
/**
 * Get task by ID (with signed image URL)
 */
async function getTaskByIdService(taskId) {
  const task = await getTaskById(taskId);

  if (task && task.image_url) {
    task.image_url = await getTaskImageUrl(task.image_url, bucketName);
  }

  return task;
}

/**
 * Update task
 */
async function updateTaskService(taskId, updates, file) {
  if (file) {
    const imageName = `${Date.now()}-${file.originalname}`;
    await uploadTaskImage(file.buffer, imageName, bucketName, file.mimetype);
    updates.image_url = imageName;
  }

  return await updateTask(taskId, updates);
}

/**
 * Delete task
 */
async function deleteTaskService(taskId) {
  return await deleteTask(taskId);
}

/**
 * Get tasks by user (with optional search)
 */
async function getTasksByUserService(whereClause) {
  const tasks = await getTasksByUser(whereClause);

  for (const task of tasks) {
    if (task.image_url) {
      task.image_url = await getTaskImageUrl(task.image_url, bucketName);
    }
  }

  return tasks;
}

/**
 * Get tasks with pagination
 */
async function getTasksPaginationService(userId, page = 1, limit = 5) {
  const offset = (page - 1) * limit;

  const whereClause = { user_id: userId };

  const totalTasks = await countTasks(whereClause);
  const tasks = await getTaskPagination(whereClause, limit, offset);

  for (const task of tasks) {
    if (task.image_url) {
      task.image_url = await getTaskImageUrl(task.image_url, bucketName);
    }
  }

  return {
    tasks,
    currentPage: page,
    totalPages: Math.ceil(totalTasks / limit),
    totalTasks,
  };
}
async function getDashboardDataService(userId) {
  // Count stats
  const total = await countTasks({ user_id: userId });
  const completed = await countTasks({ user_id: userId, is_completed: true });
  const pending = await countTasks({ user_id: userId, is_completed: false });
  const highPriority = await countTasks({
    user_id: userId,
    priority: "Extreme",
  });

  // Fetch lists
  const upcomingTasks = await getUpcomingTasks();
  const importantTasks = await getImportantTasks();

  // Replace S3 image keys with signed URLs
  for (const task of [...upcomingTasks, ...importantTasks]) {
    if (task.image_url) {
      const getObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: task.image_url,
      };
      const command = new GetObjectCommand(getObjectParams);
      task.image_url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    }
  }

  return {
    summary: { total, completed, pending, highPriority },
    upcomingTasks,
    importantTasks,
  };
}

module.exports = {
  createTaskService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  getTasksByUserService,
  getTasksPaginationService,
  getDashboardDataService,
  getTasksWithSearch,
};
