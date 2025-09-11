const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/adduser", userController.addUser);

module.exports = router;
