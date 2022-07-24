const express = require("express");
const authController = require("../controllers/authController");
const blogController = require("../controllers/blogController");
const blogCommentRoute = require("../routes/blogCommentRoutes");

const router = express.Router();

router.use("/:blogID/comments", blogCommentRoute);

router.get("/blog-comment-stats", blogController.getBlogCommentStats);

router.get("/", blogController.getAllPosts);

router.get("/:id", blogController.getPost);

router.post(
  "/",
  authController.privateRoute,
  authController.restrictTo("admin"),
  // blogController.uploadBlogImage,
  blogController.createPost
);

router.patch(
  "/:id",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogController.updatePost
);

router.delete(
  "/:id",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogController.deletePost
);

router.patch(
  "/:id/status",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogController.toggleBlogPostActive
);

router.patch(
  "/:id/featured",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogController.toggleBlogPostFeatured
);

module.exports = router;
