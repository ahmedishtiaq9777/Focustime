const jwt = require("jsonwebtoken");
const dbOps = require("./dboperationswithSequelize");

const JWT_SECRET = process.env.JWT_SECRET || "superSecret";

// Generate a JWT
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

// Verify a JWT and check blacklist
async function verifyToken(token) {
  // await dbOps.initDB();
  let isBlacklisted = await dbOps.isTokenBlacklisted(token);
  if (isBlacklisted) throw new Error("Token is blacklisted");
  return jwt.verify(token, JWT_SECRET);
}

// Logout (Blacklist the token)
async function logout(token) {
  const decoded = jwt.decode(token);
  const exp = decoded.exp; // in seconds
  const ttl = exp - Math.floor(Date.now() / 1000); // Time left in seconds

  // await dbOps.initDB();

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 15 mins from now
  await dbOps.addBlacklistedToken(token, expiresAt);

  // await dbOps.shutdown();

  // Store token in Redis with expiry equal to JWT expiry
  // await redisClient.set(`bl_${token}`, true, { EX: ttl });
}

module.exports = { generateToken, verifyToken, logout };
