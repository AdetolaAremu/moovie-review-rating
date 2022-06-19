const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const sharp = require("sharp");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// S3 config
const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BUCKET_NAME,
  location: process.env.AWS_DEFAULT_REGION,
});

// to make sure what we are sending is an image, there are other options like csv etc
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("This file is not an image", 400), false);
  }
};

// multer s3 config
const multerS3Config = multerS3({
  s3: s3Config,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    if (process.env.NODE_ENV === "development") {
      console.log(file);
    }
    cb(null, `user-${req.user.id}-${Date.now().toString()}`);
  },
});

// the multer upload function where the two options are called
const upload = multer({
  storage: multerS3Config,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 1, // we are allowing only 1 MB files
  },
});

// to upload the image
exports.uploadUserAvatar = upload.single("avatar");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    message: "Users retrieved successfully",
    data: {
      users,
    },
  });
});

exports.getAUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("User not found"));
  }

  res.status(200).json({
    message: "User retrieved",
    data: {
      user,
    },
  });
});

exports.updateLoggedInUser = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirm_password) {
    return next(new AppError("You can not update password with this request"));
  }

  const filteredObjs = filterObj(
    req.body,
    "first_name",
    "last_name",
    "middle_name",
    "email",
    "username"
  );
  if (req.file) filteredObjs.avatar = req.file.location;

  const user = await User.findByIdAndUpdate(req.user.id, filteredObjs, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: "Data updated successfully",
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("User not found"));
  }

  res.status(200).json({
    message: "User deleted successfully",
  });
});

exports.loggedInUser = catchAsync(async (req, res, next) => {
  req.params.id = req.user;

  next();
});

exports.getUserCommentStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "user",
        as: "user_comments_count",
      },
    },
    {
      $addFields: {
        user_comments_count: { $size: "$user_comments_count" },
      },
    },
    {
      $sort: {
        user_comments_count: -1,
      },
    },
    {
      $project: {
        password: 0,
        middle_name: 0,
        role: 0,
        otpVerified: 0,
        isActive: 0,
        __v: 0,
        passwordChangedAt: 0,
        email: 0,
      },
    },
  ]);

  res.status(200).json({
    message: "Stats retrieved successfully",
    data: {
      stats,
    },
  });
});
