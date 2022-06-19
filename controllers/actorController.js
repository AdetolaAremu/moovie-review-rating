const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const sharp = require("sharp");
const { promisify } = require("util");
const Actor = require("../models/actorModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// S3 config
const s3Config = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: process.env.AWS_ACTOR_AVATAR_BUCKET_NAME,
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
  bucket: process.env.AWS_ACTOR_AVATAR_BUCKET_NAME,
  acl: "public-read",
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    if (process.env.NODE_ENV === "development") {
      console.log(file);
    }
    cb(null, `actor-${Date.now().toString()}`);
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
exports.uploadActorAvatar = upload.single("avatar");

// delete image/file
// const unlinkAsync = promisify(fs.unlink);

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllActors = catchAsync(async (req, res, next) => {
  const actors = await Actor.find();

  res.status(200).json({
    message: "Actors retrieved successfully",
    actorsLength: actors.length,
    data: {
      actors,
    },
  });
});

exports.createActor = catchAsync(async (req, res, next) => {
  const actor = await Actor.create({
    name: req.body.name,
    description: req.body.description,
    avatar: req.file.location,
  });

  res.status(200).json({
    message: "Actor created successfully",
    data: {
      actor,
    },
  });
});

exports.getActor = catchAsync(async (req, res, next) => {
  const actor = await Actor.findById(req.params.id);

  if (!actor) {
    return next(new AppError("Actor not found", 404));
  }

  res.status(200).json({
    message: "Actor retrieved successfully",
    data: {
      actor,
    },
  });
});

exports.updateActor = catchAsync(async (req, res, next) => {
  // find the actor first using find one
  const findFirst = await Actor.findOne({ _id: req.params.id });

  // then delete the image of the actor if req has file in it
  if (req && req.file) {
    const unfiltered = findFirst;
    const filename = unfiltered.avatar.split("/")[3];
    // console.log(filename);

    await s3Config.deleteObject(
      {
        Bucket: process.env.AWS_ACTOR_AVATAR_BUCKET_NAME,
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
  const filteredObjs = filterObj(req.body, "name", "description", {
    new: true,
    runValidators: true,
  });

  if (req.file) filteredObjs.avatar = req.file.location;

  const actor = await Actor.findByIdAndUpdate(req.params.id, filteredObjs, {
    new: true,
    runValidators: true,
  });

  if (!actor) {
    return next(new AppError("Actor not found", 404));
  }

  res.status(200).json({
    message: "Actor updated successfully",
    data: {
      actor,
    },
  });
});

exports.deleteActor = catchAsync(async (req, res, next) => {
  const actor = await Actor.findByIdAndDelete(req.params.id);

  const unfiltered = actor;
  const filename = unfiltered.avatar.split("/")[3];

  s3Config.deleteObject(
    {
      Bucket: process.env.AWS_ACTOR_AVATAR_BUCKET_NAME,
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

  if (!actor) {
    return next(new AppError("Actor not found", 404));
  }

  res.status(200).json({
    message: "Actor deleted successfully",
  });
});

exports.getActorMovieAppearance = catchAsync(async (req, res, next) => {
  const stats = await Actor.aggregate([
    {
      $lookup: {
        from: "movies",
        localField: "_id",
        foreignField: "actor",
        as: "children",
      },
    },
    {
      $addFields: {
        children: { $size: "$children" },
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
