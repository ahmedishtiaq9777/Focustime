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

app.listen(port);
console.log("app is running  on port ", port);

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

    const imagename = RandomImageName();

    const params = {
      Bucket: bucketName,
      Key: imagename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    const task = await dbOps.createTask(
      title,
      userId,
      scheduled_for,
      priority,
      description,
      status,
      imagename
    );
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
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
// router.route("/addtask2").post(async (req, res) => {
//   try {

//   } catch (error) {}
// });

router.put("/task/:id", upload.single("image"), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, scheduled_for, priority, description, status } = req.body;

    let updates = {
      title,
      scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
      priority,
      description,
      status,
    };
    const imagename = RandomImageName();

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

    // console.log("tasksss:", tasks);

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
