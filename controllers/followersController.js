const Follower = require("../models/followerModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.followUser = catchAsync(async (req, res, next) => {
  // user can not follow his/herself
  if (req.user.id === req.body.user) {
    return next(new AppError("You can not follow yourself", 403));
  }

  // check if this logged in user is already or has been following the user he/she is intending to follow
  const checkExist = await Follower.findOne({
    user: req.body.user,
    follower: req.user.id,
  });

  // check if it exist, if true, throw an error
  if (checkExist) {
    return next(new AppError("You are already following this user", 403));
  }

  const follow = await Follower.create({
    user: req.body.user,
    follower: req.user.id,
  });

  res.json({
    message: "You are following user, cheers",
    data: {
      follow,
    },
  });
});

// those following user
exports.getFollowers = catchAsync(async (req, res, next) => {
  const followers = await Follower.find({
    user: req.user.id,
  }).populate({
    path: "follower",
    select: "first_name last_name username",
  });

  res.json({
    message: "Followers retrieved",
    followersLength: followers.length,
    data: {
      followers,
    },
  });
});

// those user is following
exports.getFollowings = catchAsync(async (req, res, next) => {
  const following = await Follower.find({ follower: req.user.id })
    .populate({
      path: "user",
      select: "first_name last_name username",
    })
    .populate({
      path: "follower",
      select: "first_name last_name username",
    });

  res.json({
    message: "Followings retrieved",
    followingLength: following.length,
    data: {
      following,
    },
  });
});

exports.unFollowUser = catchAsync(async (req, res, next) => {
  // check if record exist
  const getFollow = await Follower.findOne({
    user: req.params.id, //the user that is about to be unfollowed
    follower: req.user.id, //the logged in user id
  });

  // if collection does not exist
  if (!getFollow) {
    return next(new AppError("You are not follower this user", 404));
  }

  await Follower.findByIdAndDelete(getFollow.id);

  res.json({
    message: "You have successfully unfollowed user",
  });
});
