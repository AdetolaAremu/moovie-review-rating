const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const blogPost = require("../models/blogPostModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

// S3 config
const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_BLOG_POST_IMAGE,
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
  bucket: process.env.AWS_BLOG_POST_IMAGE,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    if (process.env.NODE_ENV === "development") {
      console.log(file);
    }
    cb(null, `movie-${Date.now().toString()}`);
  },
});

// the multer upload function where the two options are called
const upload = multer({
  storage: multerS3Config,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 1, // we are allowing only 1 MB file
  },
});

// to upload the image
exports.uploadBlogImage = upload.single("coverImage");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllPosts = catchAsync(async (req, res, next) => {
  const posts = await blogPost.find();

  res.json({
    message: "Blog posts retrieved",
    postCount: posts.length,
    data: {
      posts,
    },
  });
});

exports.createPost = catchAsync(async (req, res, next) => {
  const post = await blogPost.create({
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
    coverImage: "image.jpg",
    isFeatured: req.body.isFeatured,
    category: req.body.category,
  });

  res.json({
    message: "Post created successfully",
    data: {
      post,
    },
  });
});

exports.getPost = catchAsync(async (req, res, next) => {
  const post = await blogPost.findById(req.params.id).populate("thecomments");

  if (!post) {
    return next(new AppError("Post not found"));
  }

  res.json({
    message: "Post retrieved successfully",
    data: {
      post,
    },
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  // find the actor first using find one
  const findFirst = await blogPost.findOne({ _id: req.params.id });

  // then delete the image of the actor if req has file in it
  if (req && req.file) {
    const unfiltered = findFirst;
    const filename = unfiltered.avatar.split("/")[3];
    // console.log(filename);

    await s3Config.deleteObject(
      {
        Bucket: process.env.AWS_BLOG_POST_IMAGE,
        Key: `${filename}`,
      },
      async (err, data) => {
        console.error(err);
        console.log(data);
        if (process.env.NODE_ENV === "development") {
          if (err) {
            console.log("Error: Object delete failed.");
          } else {
            console.log("Success: Object delete successful.");
          }
        }
      }
    );
  }

  // then find again and update the actor
  const filteredObjs = filterObj(req.body, "title", "body", "tags", {
    new: true,
    runValidators: true,
  });

  if (req.file) filteredObjs.coverImage = req.file.location;

  if (req.tags) findFirst.tags.delete(); //delete if new req comes with tags

  const post = await blogPost.findByIdAndUpdate(req.params.id, filteredObjs, {
    new: true,
    runValidators: true,
  });

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  res.status(200).json({
    message: "Post updated successfully",
    data: {
      post,
    },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await blogPost.findByIdDelete(req.params.id);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  const unfiltered = post;
  const filename = unfiltered.coverImage.split("/")[3];

  s3Config.deleteObject(
    {
      Bucket: process.env.AWS_BLOG_POST_IMAGE,
      Key: `${filename}`,
    },
    async (err, data) => {
      if (process.env.NODE_ENV === "development") {
        if (err) {
          console.log("Error: Object delete failed.");
        } else {
          console.log("Success: Object delete successful.");
        }
      }
    }
  );

  res.status(200).json({
    message: "Post deleted successfully",
  });
});

exports.toggleBlogPostActive = catchAsync(async (req, res, next) => {
  const blog = await blogPost.findById(req.params.id);

  if (!blog) {
    return next(new AppError("Post not found", 404));
  }

  blog.isActive = !blog.isActive;
  blog.save({ validateBeforeSave: true });

  res.json({
    message: "Category active status updated successfully",
    data: {
      blog,
    },
  });
});

exports.toggleBlogPostFeatured = catchAsync(async (req, res, next) => {
  const blog = await blogPost.findById(req.params.id);

  if (!blog) {
    return next(new AppError("Post not found", 404));
  }

  blog.isFeatured = !blog.isFeatured;
  blog.save({ validateBeforeSave: true });

  res.json({
    message: "Post featured status updated successfully",
    data: {
      blog,
    },
  });
});

exports.getBlogCommentStats = catchAsync(async (req, res, next) => {
  const blog = await blogPost.aggregate([
    {
      $lookup: {
        from: "blogcomments",
        localField: "_id",
        foreignField: "blog",
        as: "comments_count",
      },
    },
    {
      $addFields: { comments_count: { $size: "$comments_count" } },
    },
    {
      $sort: { comments_count: -1 },
    },
    {
      $project: {
        isFeatured: 0,
        isActive: 0,
        tags: 0,
        lastUpdatedAt: 0,
        category: 0,
        __v: 0,
      },
    },
  ]);

  res.json({
    message: "Blog Comments stats retrieved successfully",
    data: {
      blog,
    },
  });
});
