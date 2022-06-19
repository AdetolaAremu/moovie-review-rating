const express = require("express");
const movieController = require("../controllers/movieController");
const authController = require("../controllers/authController");
const commentRoute = require("../routes/commentRoutes");

const router = express.Router();

router.use("/:movieID/comments", commentRoute);
// console.log(router.stack);

router.get("/stats", movieController.getCommentsStats);

router.get("/", movieController.getMovies);
router.get("/:id", movieController.getAMovie);

// router.use(authController.privateRoute);
// router.use(authController.restrictTo("admin"));

router.post(
  "/",
  authController.privateRoute,
  authController.restrictTo("admin"),
  movieController.uploadImages,
  movieController.createMovie
);
router
  .route("/:id")
  .patch(
    authController.privateRoute,
    authController.restrictTo("admin"),
    movieController.updateMovie
  )
  .delete(
    authController.privateRoute,
    authController.restrictTo("admin"),
    movieController.deleteMovie
  );

module.exports = router;
