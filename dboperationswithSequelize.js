const {
  sequelize,
  Task,
  BlacklistedToken,
  User,
  Notification,
} = require("./models");
const { Op } = require("sequelize");

/**
 * Initialize DB Connection
 */
async function initDB() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
}
async function shutdown() {
  try {
    await sequelize.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error closing connection:", error);
  }
}

async function getAllUsers() {
  return await User.findAll();
}

/* ======================
   TASK OPERATIONS
====================== */
function formatForSqlServer(date) {
  return new Date(date).toISOString().replace("T", " ").substring(0, 23);
}

/**
 * Create a new task
 */

async function createTask(
  title,
  user_id,
  scheduled_for = null,
  priority = null,
  description = null,
  status = "Pending",
  image_url = null
) {
  const cleanDate = scheduled_for ? new Date(scheduled_for) : null;

  const newTask = await Task.create({
    title,
    user_id,
    scheduled_for: cleanDate,
    priority,
    description,
    status,
    image_url,
  });
  return newTask;
}

/**
 * Get all tasks
 */
async function getAllTasks() {
  return await Task.findAll();
}
async function countAll(where = {}) {
  return Task.count({ where });
}
async function getTasks(where = {}, options = {}) {
  return Task.findAll({
    where,
    order: options.order || [["created_at", "DESC"]],
    limit: options.limit || null,
  });
}
// Get upcoming tasks (next 7 days)
async function getUpcomingTasks(limit = 5) {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return getTasks(
    {
      is_completed: false,
      scheduled_for: { [Op.between]: [today, nextWeek] },
    },
    { order: [["scheduled_for", "ASC"]], limit }
  );
}
// Get important tasks
async function getImportantTasks(limit = 5) {
  return getTasks(
    { is_completed: false, priority: "Extreme" },
    { order: [["scheduled_for", "ASC"]], limit }
  );
}

/**
 * Get task by ID
 */
async function getTaskById(id) {
  return await Task.findByPk(id);
}

/**
 * Update task by ID
 */
async function updateTask(id, updates) {
  const task = await Task.findByPk(id);
  if (!task) return null;
  return await task.update(updates);
}

/**
 * Delete task by ID
 */
async function deleteTask(id) {
  return await Task.destroy({ where: { id } });
}

/**
 * Get tasks by user
 */
async function getTasksByUser(where) {
  return await Task.findAll({ where: where });
}

async function getTaskcountByUser(where) {
  return await Task.count({
    where: where,
  });
}
async function getTaskpagination(where, limit, offset) {
  return await Task.findAll({
    where: where,
    limit,
    offset,
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ], // or ASC
  });
}

/*
Notifications

*/

async function getNotificationById(id) {
  return await Notification.findByPk(id);
}

async function getNotificationsByUser(userId) {
  try {
    const notifications = await Notification.findAll({
      where: { userId: userId, isRead: false },
      order: [["createdAt", "DESC"]],
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
async function createNotification({
  user_id,
  task_id,
  message,
  is_read = false,
}) {
  return await Notification.create({
    userId: user_id, // ✅ use camelCase
    taskId: task_id, // ✅ use camelCase
    message,
    is_read,
  });
}
async function getallnotification() {
  return await Notification.findAll({
    where: { isRead: false },
  });
}

/* ======================
   BLACKLISTED TOKEN OPERATIONS
====================== */

/**
 * Add token to blacklist
 */
async function addBlacklistedToken(token, expiresAt, reason = null) {
  return await BlacklistedToken.create({
    token,
    expires_at: expiresAt,
    reason,
  });
}

/**
 * Get all blacklisted tokens
 */
async function getAllBlacklistedTokens() {
  return await BlacklistedToken.findAll();
}

/**
 * Check if a token is blacklisted
 */
async function isTokenBlacklisted(token) {
  const record = await BlacklistedToken.findOne({
    where: {
      token,
      expires_at: { [Op.gt]: new Date() }, // Still valid
    },
  });
  return Boolean(record); // Same as !!entry, but more readable
}

/**
 * Delete expired tokens
 */
async function deleteExpiredTokens() {
  return await BlacklistedToken.destroy({
    where: {
      expires_at: {
        [Op.lt]: new Date(),
      },
    },
  });
}

module.exports = {
  initDB,
  shutdown,
  getAllUsers,
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByUser,
  addBlacklistedToken,
  getAllBlacklistedTokens,
  isTokenBlacklisted,
  deleteExpiredTokens,
  getTaskcountByUser,
  getTaskpagination,
  countAll,
  getUpcomingTasks,
  getImportantTasks,
  createNotification,
  getNotificationById,
  getNotificationsByUser,
  getallnotification,
};
