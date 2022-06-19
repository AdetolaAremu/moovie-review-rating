const express = require("express");
const activityController = require("../controllers/activityController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/",
  authController.privateRoute,
  activityController.getUserBeingFollowedCommentActivity
);

module.exports = router;
