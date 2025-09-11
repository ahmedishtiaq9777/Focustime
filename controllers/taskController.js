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

async function createTask(req, res) {
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
    res.status(500).json({ error: "Failed to create task" });
  }
}

async function getTasksWithSearchControler(req, res) {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const search = req.query.search || "";
    const tasks = await getTasksWithSearch(userId, search);

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error.message);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
}

/**
 * Get Paginated Tasks
 */
async function getTasks(req, res) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const result = await getTasksPaginationService(userId, page, limit);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const updates = req.body;

    const updatedTask = await updateTaskService(taskId, updates, req.file);

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("❌ Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = req.params.id;

    const deleted = await deleteTaskService(taskId);
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    const deletedCount = await deleteNotificationByTaskId(taskId);

    if (deletedCount == 0) {
      console.log("No notification found for the task deleted");
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
}

async function getDashboardData(req, res) {
  try {
    const data = await getDashboardDataService(req.user.id);
    res.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Server error fetching dashboard data" });
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
