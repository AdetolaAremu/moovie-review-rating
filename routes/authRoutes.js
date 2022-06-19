const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/reset-password", authController.forgotPassword);
router.patch("/verify-user", authController.verifyUser);
router.patch("/change-password", authController.changePassword);

module.exports = router;
