const APIFeatures = require("../utils/apiFeatures");
const Category = require("../models/categoryModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const Features = new APIFeatures(Category.find(), req.query)
    .sort()
    .fields()
    .paginate()
    .filter();

  const categories = await Features.query;

  res.status(200).json({
    message: "Categories retrieved",
    data: {
      categories,
    },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create({ name: req.body.name });

  res.status(200).json({
    message: "Category created successfully",
    data: {
      category,
    },
  });
});

exports.getACategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found"));
  }

  res.status(200).json({
    message: "Category retrieved",
    data: {
      category,
    },
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const filteredObjs = filterObj(req.body, "name");

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    filteredObjs,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    return next(new AppError("Category not found"));
  }

  res.status(200).json({
    message: "Category updated successfully",
    data: {
      category,
    },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError("Category not found"));
  }

  res.status(200).json({
    message: "Category deleted successfully",
  });
});

exports.deactivateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    message: "Category deactivated successfully",
    data: {
      category,
    },
  });
});

exports.getCategoryStats = catchAsync(async (req, res, next) => {
  const stats = await Category.aggregate([
    {
      $lookup: {
        from: "movies",
        localField: "_id",
        foreignField: "category",
        as: "movies_count",
      },
    },
    {
      $addFields: {
        movies_count: { $size: "$movies_count" },
      },
    },
    {
      $sort: {
        movies_count: -1,
      },
    },
    {
      $project: {
        isActive: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  res.status(200).json({
    message: "Category stats retrieved successfully",
    data: {
      stats,
    },
  });
});
