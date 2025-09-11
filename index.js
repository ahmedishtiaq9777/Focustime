require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import routes
const authRoutes = require("./routes/authroutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");

// Import notification service
const notificationService = require("./services/notificationservice");

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Initialize notification service with io
notificationService.initNotificationService(io);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes (login, logout)
app.use("/api", authRoutes);

app.use("/api", taskRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);

// Start server
const PORT = process.env.PORT || 8090;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔔 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
