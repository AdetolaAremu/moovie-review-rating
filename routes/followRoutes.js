const express = require("express");
const followerController = require("../controllers/followersController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/", authController.privateRoute, followerController.getFollowers);

router.post("/", authController.privateRoute, followerController.followUser);

router.get(
  "/followings",
  authController.privateRoute,
  followerController.getFollowings
);

router.delete(
  "/:id",
  authController.privateRoute,
  followerController.unFollowUser
);

module.exports = router;
