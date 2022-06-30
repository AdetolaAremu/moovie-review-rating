const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const Movie = require("../models/moviesModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_MOVIE_IMAGES_BUCKET_NAME,
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
  bucket: process.env.AWS_MOVIE_IMAGES_BUCKET_NAME,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    if (process.env.NODE_ENV === "development") {
      console.log(file);
    }
    cb(null, `movie-${Date.now().toString()}.jpeg`);
  },
});

// the multer upload function where the two options are called
const upload = multer({
  storage: multerS3Config,
  fileFilter: multerFilter,
  limits: {
    fileSize: 1024 * 1024 * 0.5, // we are allowing only 1 MB file
  },
});

// to upload the image
exports.uploadImages = upload.fields([{ name: "images", maxCount: 3 }]);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMovies = catchAsync(async (req, res, next) => {
  const movies = await Movie.find();

  res.status(200).json({
    message: "Movies retrieved successfully",
    movieLength: movies.length,
    data: {
      movies,
    },
  });
});

exports.createMovie = catchAsync(async (req, res, next) => {
  // map through the images I am sending and get the file location(s)
  const allImages = await Promise.all(
    req.files.images.map(async (image) => image.location)
  );

  const movie = await Movie.create({
    name: req.body.name,
    category: req.body.category,
    summary: req.body.summary,
    actor: req.body.actor,
    images: allImages,
  });

  res.status(201).json({
    message: "Movie created successfully",
    data: {
      movie,
    },
  });
});

exports.getAMovie = catchAsync(async (req, res, next) => {
  const movie = await Movie.findById(req.params.id).populate("thecomment");

  if (!movie) {
    return next(new AppError("Movie not found", 404));
  }

  res.status(200).json({
    message: "Movie retrieved successfully",
    data: {
      movie,
    },
  });
});

exports.updateMovie = catchAsync(async (req, res, next) => {
  const getMovieFirst = await Movie.findOne({ _id: req.params.id });

  for (const k in file) {
    getMovieFirst.images.push({ Key: file[k].fileName });
  }

  // if (req && req.files) {
  const params = {
    Bucket: process.env.AWS_MOVIE_IMAGES_BUCKET_NAME,
    Delete: {
      // required
      Objects: objects,
    },
  };
  // }

  const filteredObjs = filterObj(
    req.body,
    "name",
    "category",
    "summary",
    "actor"
  );

  const movie = await Movie.findByIdAndUpdate(getMovieFirst.id, filteredObjs, {
    new: true,
    runValidators: true,
  });

  if (!movie) {
    return next(new AppError("Movie not found", 404));
  }

  res.status(200).json({
    message: "Movie updated successfully",
    data: {
      movie,
    },
  });
});

exports.deleteMovie = catchAsync(async (req, res, next) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  // console.log(movie.images);

  const filenames = movie.images.map((item) => item.split("/")[4]);
  console.log(filenames);

  // pass to s3.deleteObject to delete it.
  s3Config.deleteObject(
    {
      Bucket: process.env.AWS_MOVIE_IMAGES_BUCKET_NAME,
      Key: `${filenames}`,
    },
    async (err, data) => {
      if (process.env.NODE_ENV === "development") {
        if (err) {
          console.log("Error: Object delete failed.");
          console.log(err.stack);
        } else {
          console.log("Success: Object delete successful.");
        }
      }
    }
  );

  // for (const k in file) {
  //   movie.images.push({ Key: file[k].fileName });
  // }

  // if (req && req.files) {
  // const params = {
  //   Bucket: process.env.AWS_MOVIE_IMAGES_BUCKET_NAME,
  //   Delete: {
  //     // required
  //     Objects: movie.images,
  //   },
  // };

  // s3Config.deleteObjects(params, function (err, data) {
  //   if (err) console.log(err); // an error occurred
  //   else console.log(data); // successful response
  // });

  if (!movie) {
    return next(new AppError("Movie not found", 404));
  }

  res.status(200).json({
    message: "Movie deleted successfully",
  });
});

exports.getCommentsStats = catchAsync(async (req, res, next) => {
  const stats = await Movie.aggregate([
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "movie",
        as: "comments_count",
      },
    },
    {
      $addFields: {
        comments_count: { $size: "$comments_count" },
      },
    },
    {
      $sort: { comments_count: -1 },
    },
    {
      $project: {
        isFeatured: 0,
        isActive: 0,
        category: 0,
        actor: 0,
        createdAt: 0,
        lastUpdatedAt: 0,
        __v: 0,
      },
    },
  ]);

  res.status(200).json({
    message: "Movie Stats retrieved successfully",
    data: {
      stats,
    },
  });
});
