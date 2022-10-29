const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  comment: {
    type: String,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  movie: {
    type: mongoose.Schema.ObjectId,
    ref: "Movie",
  },
  // createdAt: {
  //   type: Date,
  //   default: Date.now()
  // }
});

activitySchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "first_name last_name username",
  }).populate({
    path: "movie",
    select: "name summary -category -actor",
  });
  next();
});

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
