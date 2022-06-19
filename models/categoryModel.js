const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category is required"],
    unique: [true, "Category name has been taken"],
    minlength: [3, "Category can not be less than three(3) characters"],
    maxlength: [30, "Category can not be more than three(30) characters"],
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

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
