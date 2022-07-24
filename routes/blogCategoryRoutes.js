const express = require("express");
const authController = require("../controllers/authController");
const blogCategoryController = require("../controllers/blogCategoryController");

const router = express.Router();

router.get("/", blogCategoryController.getAllCategories);

router.get("/:id", blogCategoryController.getCategory);

router.post(
  "/",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogCategoryController.createCategory
);

router.patch(
  "/:id",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogCategoryController.updateCategory
);

router.delete(
  "/:id",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogCategoryController.deleteCategory
);

router.patch(
  "/:id/status",
  authController.privateRoute,
  authController.restrictTo("admin"),
  blogCategoryController.toggleBlogActive
);

module.exports = router;
