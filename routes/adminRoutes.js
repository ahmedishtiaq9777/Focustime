const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  authenticateToken,
  authorizeAdmin,
} = require("../middleware/middleware");

router.get("/logs", authenticateToken, authorizeAdmin, adminController.getLogs);
router.get(
  "/logs/file",
  authenticateToken,
  authorizeAdmin,
  adminController.getLogFile
);
router.get(
  "/users",
  authenticateToken,
  authorizeAdmin,
  adminController.manageUsers
);

module.exports = router;
