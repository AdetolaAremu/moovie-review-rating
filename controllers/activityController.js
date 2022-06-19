const Activity = require("../models/activitiesModel");
const Follow = require("../models/followerModel");
const catchAsync = require("../utils/catchAsync");

// to get user acitvity for comments only
exports.getUserBeingFollowedCommentActivity = catchAsync(
  async (req, res, next) => {
    // check if the logged in user is following the user that has commented on a movie
    const check = await Follow.find({
      follower: req.user.id, //logged in user
    });

    // map through those the user is following and get the activities of those they are following
    const activities = await Promise.all(
      check.map(({ user }) => Activity.find({ user }))
    );

    res.json({
      message: "Activity retrieved",
      activityLength: activities.length,
      data: {
        activities,
      },
    });
  }
);
