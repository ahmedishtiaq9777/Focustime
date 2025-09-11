const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const authenticateToken = require("../middleware");
router.use(authenticateToken);

// Create task (with optional image upload)
router.post("/addtask2", upload.single("image"), taskController.createTask);

// Get all tasks (with pagination support)
router.get("/tasks", taskController.getTasks);

// Search tasks
router.get("/tasksWithsearch", taskController.getTasksWithSearchControler);

// Get dashboard data
router.get("/getDashboardData", taskController.getDashboardData);

// Update task
router.put("/task/:id", upload.single("image"), taskController.updateTask);

// Delete task
router.delete("/tasks/:id", taskController.deleteTask);

// Get single task by ID

module.exports = router;
