const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      minlength: [10, "Title can not be less than 10 characters"],
      maxlength: [300, "Title can not be more than 300 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      minlength: [10, "Body can not be less than 150 characters"], //must be at least 150 characters
      maxlength: [1000, "Body can not be more than 1000 characters"],
    },
    tags: [
      {
        type: String,
      },
    ],
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "BlogCategory",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blogPostSchema.virtual("thecomments", {
  ref: "BlogComment",
  foreignField: "blog",
  localField: "_id",
});

const blogPost = mongoose.model("BlogPost", blogPostSchema);

module.exports = blogPost;
