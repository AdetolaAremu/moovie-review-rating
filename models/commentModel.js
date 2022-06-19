const mongoose = require("mongoose");
const Movie = require("./moviesModel");

const commentRatingSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: [true, "Comment is required"],
    minlength: [10, "Comment can not be less than 10 characters"],
    maxlength: [350, "Comment can not be more than 350 characters"],
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating can not be less than 1"],
    max: [5, "Rating can not be more than 5"],
    default: 0,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    // required: [true, "Comment has to belong to a user"],
  },
  movie: {
    type: mongoose.Schema.ObjectId,
    ref: "Movie",
    // required: [true, "Comment has to belong to a movie"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now(),
  },
});

commentRatingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "_id first_name last_name",
  });
  next();
});

commentRatingSchema.statics.calcRating = async function (movieID) {
  const stats = await this.aggregate([
    {
      $match: { movie: movieID },
    },
    {
      $group: {
        _id: "$movie",
        numRatings: { $sum: 1 },
        ratingAvg: { $avg: "$rating" },
      },
    },
  ]);
  console.log(stats);
  console.log(movieID);

  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieID, {
      averageRating: stats[0].ratingAvg,
      ratingsCount: stats[0].numRatings,
    });
  } else {
    // return it back to its default when/if there is no ratings or ratings qty
    await Movie.findByIdAndUpdate(movieID, {
      averageRating: 0,
      ratingsCount: 0,
    });
  }
};

commentRatingSchema.pre("save", function () {
  this.constructor.calcRating(this.movie);
});

const Comment = mongoose.model("Comment", commentRatingSchema);

module.exports = Comment;
