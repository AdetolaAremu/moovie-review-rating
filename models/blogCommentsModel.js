const mongoose = require("mongoose");

const blogCommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: [true, "Comment is required"],
    minlength: [10, "Comment can not be less than 10 characters"],
    maxlength: [350, "Comment can not be more than 350 characters"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  blog: {
    type: mongoose.Schema.ObjectId,
    ref: "BlogPost",
  },
  isActive: {
    type: Boolean,
    default: true,
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

const blogComment = mongoose.model("BlogComment", blogCommentSchema);

module.exports = blogComment;
