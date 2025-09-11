const jwtService = require("../services/jwtservice");
const dbOps = require("../repositories/userRepository");
const bcrypt = require("bcryptjs");

// Login
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await dbOps.getUserByEmail(email); // implement in your User repo
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("email:", email);
    console.log("password:", password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("ispassword:", isPasswordValid);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid credentials" });

    // console.log("user:", user.uid);

    const token = jwtService.generateToken({ id: user.uid, email: user.email });
    // console.log("token:", token);

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
}

// Logout
async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(400).json({ error: "Token required" });
    }

    await jwtService.logout(token);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
}

module.exports = { login, logout };
