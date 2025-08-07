var express = require("express");
var jwt = require("jsonwebtoken");
var bodyParser = require("body-parser");
var cors = require("cors");
var router = express.Router();
var publicrouter = express.Router();
const dboperations = require("./dboperations");
const { Op } = require("sequelize");

const dbOps = require("./dboperationswithSequelize");
const { logout, verifyToken, generateToken } = require("./auth");
const authenticateToken = require("./middleware");
const Task = require("./models/task");

require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/api", authenticateToken, router);
app.use("/public", publicrouter);
var port = process.env.PORT || 8090;

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

app.listen(port);
console.log("app is running  on port ", port);

publicrouter.post("/login", (req, res) => {
  const { email, password } = req.body;

  dboperations.getusers().then((result) => {
    const allusers = result[0];

    const user = allusers.find((u) => u.email == email);

    if (!user) return res.status(401).json({ message: "User not found" });

    const isPasswordValid = password == user.password;

    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.uid, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    console.log(result[0]);

    res.json({
      token: token,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
      },
    });
  });
});

router.route("/getusers").get(async (req, res) => {
  const users = await dbOps.getAllUsers();
  res.json(users);
  console.log("All Users:", users);

  // try {
  //   dboperations.getusers().then((result) => {
  //     res.json(result[0]);
  //   });
  // } catch (err) {
  //   console.log("error:", err);
  // }
});

router.post("/adduser", (req, res) => {
  let body = { ...req.body };
  dboperations.adduser(body).then((result) => {
    res.json(result);
  });
});

router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    await logout(token);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

router.route("/tasksWithsearch").get(async (req, res) => {
  try {
    let userId = req.user.id;
    if (!userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const { search } = req.query;

    const whereClause = {
      user_id: userId, // Filter by logged-in user's tasks
    };

    console.log("userid:", userId);
    console.log("searchlen:", search.length);
    // If search is provided, filter by title using LIKE
    if (search.length > 0) {
      if (search.trim()) {
        whereClause.title = {
          [Op.like]: `%${search.trim()}%`,
        };
      }
    }

    const tasks = await dbOps.getTasksByUser(whereClause);
    // console.log("tasks:", tasks);
    res.json(tasks);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to get tasks" });
  }
});
router.delete("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await dbOps.getTaskById(taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    await task.destroy(); // deletes the task from DB
    res.status(200).json({ message: "Task deleted", taskId });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.route("/addtasks2").post(async (req, res) => {
  try {
    const { title, scheduled_for } = req.body;
    const userId = req.user.id; // Extracted from JWT

    console.log("body:", req.body);
    console.log("title:", title);
    console.log("userid:", userId);
    console.log("scheduled_for;", scheduled_for);

    let result = await dboperations.addTask(title, userId, scheduled_for);
    res.json(result);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});
router.route("/addtasks").post(async (req, res) => {
  try {
    const { title, scheduled_for } = req.body;
    const userId = req.user.id; // Extracted from JWT
    console.log("body:", req.body);
    console.log("title:", title);
    console.log("userid:", userId);
    console.log("typeof", typeof scheduled_for);

    const task = await dbOps.createTask(title, userId, scheduled_for);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

// GET /api/tasks
router.get("/tasks", async (req, res) => {
  try {
    // Parse query params (defaults: page=1, limit=10)

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const offset = (page - 1) * limit;

    const whereClause = {
      user_id: req.user.id, // optional: if you filter tasks by user
    };

    // Get total count for pagination
    const totalTasks = await dbOps.getTaskcountByUser(whereClause);

    // Fetch tasks with pagination
    const tasks = await dbOps.getTaskpagination(whereClause, limit, offset);
    console.log("tasks:", tasks);

    res.json({
      tasks: tasks,
      currentPage: page,
      totalPages: Math.ceil(totalTasks / limit),
      totalTasks,
    });
  } catch (err) {
    console.error("Pagination error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});
