const APIFeatures = require("../utils/apiFeatures");
const blogCategory = require("../models/blogCategoryModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const Features = new APIFeatures(blogCategory.find(), req.query)
    .sort()
    .fields()
    .paginate()
    .filter();

  const categories = await Features.query;

  res.json({
    message: "Blog categories retrieved",
    data: {
      categories,
    },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await blogCategory.create({ name: req.body.name });

  res.status(201).json({
    message: "Category created successfully",
    data: {
      category,
    },
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await blogCategory.findById(req.params.id);

  if (!category) {
    return next(new AppError("Blog category not found", 404));
  }

  res.json({
    message: "Category retrieved",
    data: {
      category,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const filteredObjs = filterObj(req.body, "name");

  const category = await blogCategory.findByIdAndUpdate(
    req.params.id,
    filteredObjs,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    return next(new AppError("Blog category not found", 404));
  }

  res.json({
    message: "Blog category updated successfully",
    data: {
      category,
    },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await blogCategory.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError("Blog category not found", 404));
  }

  res.json({
    message: "Category retrieved",
  });
});

exports.toggleBlogActive = catchAsync(async (req, res, next) => {
  const category = await blogCategory.findById(req.params.id);

  if (category.isActive === true) {
    category.isActive === false;
    category.save();
  }

  if (category.isActive === false) {
    category.isActive === true;
    category.save();
  }

  res.json({
    message: "Category active status updated successfully",
    data: {
      category,
    },
  });
});
