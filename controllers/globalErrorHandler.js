const AppError = require("../utils/AppError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
  // already calling these functions inside global error handler, so no need of using next()
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue); // coverts the object to array of values(from key-value pairs)
  const message = `Duplicate field value: ${value[0]}. Please use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(". ")}`; // separate the sentences with '. '
  return new AppError(message, 422);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please login again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has been expired! Please login again", 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // A) APIs
  if (req.originalUrl.startsWith("/api")) {
    // A) Operational error, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // 1) Log error
    console.log("ERROR 💥", err);

    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
  }
};

// GLOBAL ERROR HANDLING MIDLEWARE
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;
    // console.log(JSON.stringify(err));
    error.name = err.name;
    // To make isOperational = true in required cases
    if (error.name === "CastError") error = handleCastErrorDB(error); // undefined ID
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // to handle duplicate values
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error); // to handle validation error
    if (error.name === "JsonWebTokenError") error = handleJWTError(); // to handle invalid JWT
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError(); // to handle expired JWT

    sendErrorProd(error, req, res);
  }
};
