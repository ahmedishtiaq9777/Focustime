const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware"); // optional, to verify token

router.post("/login", authController.login);
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
