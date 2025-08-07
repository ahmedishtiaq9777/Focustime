const { sequelize, Task, BlacklistedToken, User } = require("./models");
const { Op } = require("sequelize");
const moment = require("moment");
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

async function createTask(title, userId, scheduledFor = null) {
  const cleanDate = scheduledFor ? new Date(scheduledFor) : null;
  console.log("date:", cleanDate);
  return await Task.create({
    title,
    user_id: userId,
    scheduled_for: cleanDate,
  });
}

/**
 * Get all tasks
 */
async function getAllTasks() {
  return await Task.findAll();
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
    order: [["created_at", "DESC"]], // or ASC
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
};
