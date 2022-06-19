const express = require("express");
const categoryController = require("../controllers/categoryController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/category-stats", categoryController.getCategoryStats);

router.get("/", categoryController.getAllCategories);

router.get("/:id", categoryController.getACategory);

// router.get("/stats", categoryController.getCategoryStats);

// logged in users and admins only
router.use(authController.privateRoute);

router.use(authController.restrictTo("admin"));

router.post("/", categoryController.createCategory);

router
  .route("/:id")
  .patch(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

router.patch("/deactivate/:id", categoryController.deactivateCategory);

module.exports = router;
