const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const blogCommentModel = require("../models/blogCommentsModel");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getComments = catchAsync(async (req, res, next) => {
  const comments = await blogCommentModel.find();

  res.json({
    message: "Comments retrieved successfully",
    data: {
      comments,
    },
  });
});

exports.createComment = catchAsync(async (req, res, next) => {
  const comment = await blogCommentModel.create({
    comment: req.body.comment,
    user: req.user.id,
    blog: req.body.blog,
  });

  res.json({
    message: "Comment created successfully",
    data: {
      comment,
    },
  });
});

exports.getComment = catchAsync(async (req, res, next) => {
  const comment = await blogCommentModel.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Comment not found"));
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

  const comment = await blogCommentModel.findByIdAndUpdate(
    req.params.id,
    filteredObjs,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!comment) {
    return next(new AppError("Comment not found"));
  }

  res.json({
    message: "Comment updated successfully",
    data: {
      comment,
    },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await blogCommentModel.findByIdAndDelete(req.params.id);

  if (!comment) {
    return next(new AppError("Comment not found"));
  }

  res.json({
    message: "Comment deleted successfully",
  });
});

exports.toggleCommentStatus = catchAsync(async (req, res, next) => {
  const comment = await blogCommentModel.findById(req.params.id);

  if (!comment) {
    return next(new AppError("Post not found", 404));
  }

  comment.isActive = !comment.isActive;
  comment.save({ validateBeforeSave: true });

  res.json({
    message: "Comment status changed successfully",
    data: {
      comment,
    },
  });
});
