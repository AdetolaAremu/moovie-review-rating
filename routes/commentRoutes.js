const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router.get("/", commentController.getAllComments);
// router.get("/:id", commentController.getComment);

// router.use(authController.privateRoute);
// router.use(authController.restrictTo("admin"));

router.post(
  "/",
  authController.privateRoute,
  // authController.restrictTo("admin"),
  commentController.createComments
);
router
  .route("/:id")
  .patch(
    authController.privateRoute,
    authController.restrictTo("admin"),
    commentController.updateComment
  )
  .delete(
    authController.privateRoute,
    authController.restrictTo("admin"),
    commentController.deleteComment
  );

module.exports = router;
