const adminService = require("../services/adminService");
const AppError = require("../utils/AppError");

const getLogs = async (req, res, next) => {
  try {
    const logs = await adminService.fetchLogsFromS3();
    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

const getLogFile = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return next(new AppError("Forbidden", 403));

    const { key } = req.query;
    const content = await adminService.getLogFileContent(key);

    res.json({ content });
  } catch (err) {
    next(err);
  }
};

const manageUsers = async (req, res, next) => {
  try {
    const users = await adminService.listAllUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, manageUsers, getLogFile };
