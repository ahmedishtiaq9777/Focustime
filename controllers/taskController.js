const {
  createTaskService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
  getTasksPaginationService,
  getTasksByUserService,
  getTasksWithSearch,
  getDashboardDataService,
} = require("../services/taskservice");
const {
  deleteNotificationByTaskId,
} = require("../repositories/notificationRepository");
const AppError = require("../utils/AppError");

async function createTask(req, res, next) {
  try {
    const { title, scheduled_for, priority, description, status } = req.body;

    const userId = req.user.id; // from JWT middleware

    const task = await createTaskService(
      { title, user_id: userId, scheduled_for, priority, description, status },
      req.file
    );

    res.status(201).json(task);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    next(error);
  }
}

async function getTasksWithSearchControler(req, res, next) {
  try {
    const userId = req.user.id;
    if (!userId) {
      return next(new AppError("Unauthorized", 403));
    }

    const search = req.query.search || "";
    const tasks = await getTasksWithSearch(userId, search);

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    next(error);
  }
}

/**
 * Get Paginated Tasks
 */
async function getTasks(req, res, next) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const result = await getTasksPaginationService(userId, page, limit);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    const updatedTask = await updateTaskService(taskId, updates, req.file);

    if (!updatedTask) {
      return next(new AppError("Task not found", 404));
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const taskId = req.params.id;

    const deleted = await deleteTaskService(taskId);
    if (!deleted) {
      return next(new AppError("Task not found", 404));
    }

    const deletedCount = await deleteNotificationByTaskId(taskId);

    if (deletedCount == 0) {
      console.log("No notification found for the task deleted");
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
}

async function getDashboardData(req, res, next) {
  try {
    const data = await getDashboardDataService(req.user.id);
    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    next(error);
  }
}
module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getDashboardData,
  getTasksWithSearchControler,
};
