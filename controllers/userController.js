const userService = require("../services/userService");

async function addUser(req, res, next) {
  try {
    const body = { ...req.body };
    const newUser = await userService.registerUser(body);
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
}

module.exports = { addUser };
