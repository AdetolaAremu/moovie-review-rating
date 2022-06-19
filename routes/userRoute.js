const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/user-comments", userController.getUserCommentStats);

router.use(authController.privateRoute);
// router.use(authController.restrictTo("admin"));

router.get(
  "/current-user",
  userController.loggedInUser,
  userController.getAUser
);

router.get("/", userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getAUser)
  .delete(userController.deleteUser);

router.patch(
  "/update-me",
  userController.uploadUserAvatar,
  // userController.resizeUserAvatar,
  userController.updateLoggedInUser
);

module.exports = router;
