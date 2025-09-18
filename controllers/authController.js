const jwtService = require("../services/jwtservice");
const dbOps = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");

// Login
async function login(req, res, next) {
  const { email, password } = req.body;

  try {
    const user = await dbOps.getUserByEmail(email); // implement in your User repo

    // if (!user) return res.status(401).json({ message: "User not found" });
    if (!user) return next(new AppError("User not found", 401));

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return next(new AppError("Invalid credentials", 401));

    const token = jwtService.generateToken({ id: user.uid, email: user.email });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
}

// Logout
async function logout(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new AppError("Token required", 400));
    }

    await jwtService.logout(token);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout };
