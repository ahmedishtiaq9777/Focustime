const { User } = require("../models");

async function getAllUsers() {
  return await User.findAll();
}
async function getUserByEmail(email) {
  return await User.findOne({ where: { email } });
}

async function createUser(userData) {
  return await User.create(userData);
}

module.exports = { getAllUsers, getUserByEmail, createUser };
