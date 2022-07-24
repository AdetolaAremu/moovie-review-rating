const express = require("express");
const blogCommentController = require("../controllers/blogCommentController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.get("/", blogCommentController.getComments);

router.get("/:id", blogCommentController.getComment);

router.post(
  "/",
  authController.privateRoute,
  // authController.restrictTo("user"),
  blogCommentController.createComment
);

router.patch(
  "/:id",
  authController.privateRoute,
  // authController.restrictTo("user"),
  blogCommentController.updateComment
);

router.delete(
  "/:id",
  authController.privateRoute,
  blogCommentController.deleteComment
);

router.patch(
  "/:id/active",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogCommentController.toggleCommentStatus
);

module.exports = router;
