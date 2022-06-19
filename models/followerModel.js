const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "User is required"],
  },
  follower: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "User must be following a user"],
    // unique: [true, "You are already following this user"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// followerSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "user",
//     select: "first_name last_name username",
//   }).populate({
//     path: "follower",
//     select: "first_name last_name username",
//   });
//   next();
// });

const Follower = mongoose.model("Follower", followerSchema);

module.exports = Follower;
