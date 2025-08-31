var express = require("express");
var jwt = require("jsonwebtoken");
var bodyParser = require("body-parser");
var cors = require("cors");
var router = express.Router();
var publicrouter = express.Router();
const dboperations = require("./dboperations");
const { Op } = require("sequelize");
const multer = require("multer");
const crypto = require("crypto");
const { createServer } = require("http");
const { Server } = require("socket.io");
const schedule = require("node-schedule");
const dayjs = require("dayjs");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const dbOps = require("./dboperationswithSequelize");
const { logout, verifyToken, generateToken } = require("./auth");
const authenticateToken = require("./middleware");

require("dotenv").config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/api", authenticateToken, router);
app.use("/public", publicrouter);
var port = process.env.PORT || 8090;

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccess_Key = process.env.SECRET_ACCESS_KEY;
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccess_Key,
  },
  region: bucketRegion,
});

// 🔹 Create HTTP server & attach Socket.IO
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
// Listen for client connections
io.on("connection", (socket) => {
  // console.log("socket:", socket);
  console.log("⚡ New client connected:", socket.id);

  // Example test notification
  socket.emit("hello", { message: "Hello from backend 👋" });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start serverr
server.listen(port, () => {
  console.log("✅ App is running on port", port);
});

// Schedule reminders for all existing tasks
async function scheduleReminders() {
  try {
    const allnotifications = await dbOps.getallnotification();
    allnotifications.forEach((N_fic) => {
      let task = dbOps.getTaskById(N_fic.taskId);

      const reminderTime = dayjs(task.scheduled_for)
        .subtract(1, "day")
        .toDate();

      // const reminderTime = dayjs().add(10, "second").toDate(); // for testing  purposes

      schedule.scheduleJob(reminderTime, () => {
        console.log(`🔔 Sending reminder: ${N_fic.message}`);
        io.emit("reminder", { notification: N_fic });
      });
    });
    console.log("✅ Reminders scheduled from DB tasks");
  } catch (error) {
    console.error("❌ Error scheduling reminders:", error);
  }
}
scheduleReminders();

const RandomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

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

    for (const task of tasks) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: task.image_url,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      task.image_url = url;
    }

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

router.post("/addtask2", upload.single("image"), async (req, res) => {
  try {
    const { title, scheduled_for, priority, description, status } = req.body;
    const userId = req.user.id; // Extracted from JWT

    let imagename = null;
    if (req.file) {
      imagename = RandomImageName();

      const params = {
        Bucket: bucketName,
        Key: imagename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);
    }

    const task = await dbOps.createTask(
      title,
      userId,
      scheduled_for,
      priority,
      description,
      status,
      imagename
    );
    // Create notification in DB
    const notificationMessage = `Reminder for task: ${task.title} schedule for ${task.scheduled_for}`;
    const notification = await dbOps.createNotification({
      user_id: userId,
      task_id: task.id,
      message: notificationMessage,
      is_read: false,
    });

    const reminderTime = dayjs(task.scheduled_for).subtract(1, "day").toDate();
    // const reminderTime = dayjs().add(10, "second").toDate();

    schedule.scheduleJob(reminderTime, () => {
      console.log(`🔔 Sending reminder: ${task.title}`);
      io.emit("reminder", { notification });
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
});

router.route("/getDashboardData").get(async (req, res) => {
  try {
    const total = await dbOps.countAll();
    const completed = await dbOps.countAll({ is_completed: true });
    const pending = await dbOps.countAll({ is_completed: false });
    const highPriority = await dbOps.countAll({ priority: "Extreme" });

    const upcomingTasks = await dbOps.getUpcomingTasks();
    const importantTasks = await dbOps.getImportantTasks();

    for (const task of upcomingTasks) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: task.image_url,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      task.image_url = url;
    }

    for (const task of importantTasks) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: task.image_url,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      task.image_url = url;
    }

    res.json({
      summary: { total, completed, pending, highPriority },
      upcomingTasks,
      importantTasks,
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "Server error fetching dashboard data" });
  }
});
router.route("/addtask").post(async (req, res) => {
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

///update task
router.put("/task/:id", upload.single("image"), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, scheduled_for, priority, description, status } = req.body;
    const imagename = RandomImageName();
    if (req.file) {
      const params = {
        Bucket: bucketName,
        Key: imagename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);
    }

    let updates = {
      title,
      scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
      priority,
      description,
      status,
    };

    // ✅ Handle image upload
    if (req.file) {
      updates.image_url = imagename;
    }

    const updatedTask = await dbOps.updateTask(taskId, updates);

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
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

    for (const task of tasks) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: task.image_url,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

      task.image_url = url;
    }

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

/// notification end point

router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("id:", id);
    const notification = await dbOps.getNotificationById(id);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const userId = req.user.id; // from frontend
    const notifications = await dbOps.getNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});
