const mongoose = require("mongoose");

const actorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Actor name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  avatar: {
    type: String,
    required: [true, "Actor photo is required"],
    default: "default.jpg",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const Actor = mongoose.model("Actor", actorSchema);

module.exports = Actor;
