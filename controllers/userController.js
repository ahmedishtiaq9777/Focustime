const userService = require("../services/userService");

async function addUser(req, res) {
  try {
    const body = { ...req.body };
    const newUser = await userService.registerUser(body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { addUser };
