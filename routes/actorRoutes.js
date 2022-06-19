const express = require("express");
const actorController = require("../controllers/actorController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/actor-stats", actorController.getActorMovieAppearance);

router.get("/", actorController.getAllActors);
router.get("/:id", actorController.getActor);

router.use(authController.privateRoute);
router.use(authController.restrictTo("admin"));

router.post(
  "/",
  actorController.uploadActorAvatar,
  // actorController.resizeUserAvatar,
  actorController.createActor
);

router
  .route("/:id")
  .patch(
    actorController.uploadActorAvatar,
    // actorController.resizeUserAvatar,
    actorController.updateActor
  )
  .delete(actorController.deleteActor);

module.exports = router;
