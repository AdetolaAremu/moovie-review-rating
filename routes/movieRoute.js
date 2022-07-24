const express = require("express");
const movieController = require("../controllers/movieController");
const authController = require("../controllers/authController");
const commentRoute = require("../routes/commentRoutes");

const router = express.Router();

router.use("/:movieID/comments", commentRoute);

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

router
  .route("/:id/featured")
  .patch(
    authController.privateRoute,
    authController.restrictTo("admin"),
    movieController.toggleMovieFeaturedStatus
  );

router
  .route("/:id/active")
  .patch(
    authController.privateRoute,
    authController.restrictTo("admin"),
    movieController.toggleMovieActiveStatus
  );

module.exports = router;
