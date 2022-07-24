const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Blog category name is required"],
    minlength: [3, "Blog category name can not be less than 3 characters"],
    maxlength: [40, "Blog category name can not be more than 40 characters"],
    unique: [true, "Blog category name already exists"],
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

const BlogCategory = mongoose.model("BlogCategory", blogSchema);

module.exports = BlogCategory;
