const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const monoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// routes
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoute");
const categoryRouter = require("./routes/categoryRoutes");
const actorRouter = require("./routes/actorRoutes");
const movieRouter = require("./routes/movieRoute");
const commentRouter = require("./routes/commentRoutes");
const followRouter = require("./routes/followRoutes");
const activityRouter = require("./routes/activityRoutes");
const blogCategoryRouter = require("./routes/blogCategoryRoutes");
const blogRouter = require("./routes/blogRoutes");
const blogCommentRouter = require("./routes/blogCommentRoutes");

// error handlers
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/globalErrorHandler");

const app = express();

app.use(helmet());

// limit number of request from a specific IP address to 100 within an hour
const limit = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

// call the rate limit middleware here
app.use("/api", limit);

// limit the size of request we are passing to the DB to 10kb/request
app.use(express.json({ limit: "10kb" }));

// Sanitize the data being sent to the DB, guarding againt nosql injection
app.use(monoSanitize());

// Sanitize and guard against XSS attack
app.use(xss());

// Prevent parameter pollution, whitelist the fields we want
app.use(
  hpp({
    whitelist: ["avgRating", "ratingsCount"],
  })
);

// serving static files
app.use(express.static(`${__dirname}/public`));

// to know the node env we are using
if (process.env.NODE_ENV === "development") {
  console.log("Development Mode 💥");
}

// routers will be here
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/actors", actorRouter);
app.use("/api/v1/movies", movieRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/follow", followRouter);
app.use("/api/v1/activities", activityRouter);
app.use("/api/v1/blog-categories", blogCategoryRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/blog-comments", blogCommentRouter);

// If any route is not found, then we throw an error using this middleware
app.use("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// global error handler for every request
app.use(globalErrorHandler);

module.exports = app;
