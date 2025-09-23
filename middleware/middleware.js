const jwt = require("jsonwebtoken");
const dbOps = require("../repositories/tokenRepository");
// const redisClient = require("./redisClient");

require("dotenv").config();
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  // await dbOps.initDB();
  const isBlacklisted = await dbOps.isTokenBlacklisted(token);

  if (isBlacklisted) {
    // await dbOps.shutdown();
    return res.status(401).json({ error: "Token is blacklisted (logged out)" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};

module.exports = { authenticateToken, authorizeAdmin };
