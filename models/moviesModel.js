const mongoose = require("mongoose");
const slugify = require("slugify");

const moviesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Movie name is required"],
    },
    summary: {
      type: String,
      required: [true, "Movie summary is required"],
      minlength: [10, "Summary can not be less than 10 characters"],
      maxlength: [350, "Summary can not be more than 350 characters"],
    },
    yearReleased: {
      type: Date,
      required: [true, "Movie year is required"],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    slug: String,
    images: [String],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Movie must belong to a category"],
    },
    actor: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Actor",
        required: [true, "A movie must have actors"],
      },
    ],
    movieReleaseDate: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// slugify the name of the movie before saving
moviesSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

moviesSchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "_id name",
  }).populate({
    path: "actor",
    select: "_id name description avatar",
  });

  next();
});

moviesSchema.virtual("thecomment", {
  ref: "Comment",
  foreignField: "movie",
  localField: "_id",
});

const Movie = mongoose.model("Movie", moviesSchema);

module.exports = Movie;
