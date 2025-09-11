const { Task } = require("../models");

const { Op } = require("sequelize");

async function createTask(
  title,
  user_id,
  scheduled_for = null,
  priority = null,
  description = null,
  status = "Not Started",
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

async function getAllTasks() {
  return await Task.findAll();
}

async function getTaskById(id) {
  return await Task.findByPk(id);
}

async function updateTask(id, updates) {
  const task = await Task.findByPk(id);
  if (!task) return null;
  return await task.update(updates);
}

async function deleteTask(id) {
  return await Task.destroy({ where: { id } });
}

async function getTasksByUser(where) {
  return await Task.findAll({ where: where });
}

async function countTasks(where = {}) {
  return Task.count({ where });
}

async function getTaskPagination(where, limit, offset) {
  return Task.findAll({
    where,
    limit,
    offset,
    order: [
      ["created_at", "DESC"],
      ["id", "DESC"],
    ],
  });
}

async function getUpcomingTasks(limit = 5) {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return Task.findAll({
    where: {
      is_completed: false,
      scheduled_for: { [Op.between]: [today, nextWeek] },
    },
    order: [["scheduled_for", "ASC"]],
    limit,
  });
}

async function getImportantTasks(limit = 5) {
  return Task.findAll({
    where: { is_completed: false, priority: "Extreme" },
    order: [["scheduled_for", "ASC"]],
    limit,
  });
}

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByUser,
  countTasks,
  getTaskPagination,
  getUpcomingTasks,
  getImportantTasks,
};
