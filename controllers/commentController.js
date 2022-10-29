const APIFeatures = require("../utils/apiFeatures");
const Comment = require("../models/commentModel");
const Activity = require("../models/activitiesModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllComments = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.movieID) filter = { movie: req.params.movieID };

  const Features = new APIFeatures(Comment.find(filter), req.query)
    .sort()
    .fields()
    .filter()
    .paginate();

  const comments = await Features.query;

  res.json({
    message: "Comments retrieved successfully",
    data: {
      comments,
    },
  });
});

exports.createComments = catchAsync(async (req, res, next) => {
  const comment = await Comment.create({
    comment: req.body.comment,
    rating: req.body.rating,
    user: req.user.id,
    movie: req.body.movie,
  });

  await Activity.create({
    comment: comment.comment,
    user: comment.user,
    movie: comment.movie,
  });

  res.json({
    message: "Comment created successfully",
    data: {
      comment,
    },
  });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }

  res.json({
    message: "Comment retrieved successfully",
    data: {
      comment,
    },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const filteredObjs = filterObj(req.body, "comment");

  const comment = await Comment.findByIdAndUpdate(req.params.id, filteredObjs, {
    new: true,
    runValidators: true,
  });

  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }

  res.json({
    message: "Comment updated successfully",
    data: {
      comment,
    },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Comment not found", 404));
  }

  res.json({
    message: "Comment deleted successfully",
  });
});
