const { promisify } = require("util");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const emailHandler = require("../utils/emailHandler");

const signedToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.registerUser = catchAsync(async (req, res, next) => {
  const otpToken = (Math.random() + 1).toString(36).substring(2);

  await User.create({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    middle_name: req.body.middle_name,
    email: req.body.email,
    username: req.body.username,
    avatar: req.body.avatar,
    password: req.body.password,
    confirm_password: req.body.confirm_password,
    otp: otpToken,
  });

  res.status(200).json({
    message:
      "Your account has been created, please check your email for verification code",
  });
});

exports.verifyUser = catchAsync(async (req, res, next) => {
  let token;

  if (req.body.token) token = req.body.token;

  if (!token) {
    return next(new AppError("Token field can not be empty", 422));
  }

  const user = await User.findOne({ otp: token });

  if (!user) {
    return next(new AppError("Token or link is invalid", 400));
  }

  user.otp = undefined;
  user.otpVerified = true;
  user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Your account has been verified",
  });
});

exports.loginUser = catchAsync(async (req, res, next) => {
  if (req.body.email) {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new AppError("Email and/or Password fields can not be empty", 422)
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(
        new AppError(
          "User does not exist, please reconfirm your credentials",
          404
        )
      );
    }

    if (user.otpVerified !== true) {
      return next(
        new AppError(
          "You have not verified your account, please check your mail for verification code or link",
          400
        )
      );
    }

    if (!(await user.correctPassword(password, user.password))) {
      return next(new AppError("Email and Password do not match", 400));
    }

    const token = signedToken(user.id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    res.cookie("jwt", token, cookieOptions);

    if (process.env.NODE_ENV === "production") cookieOptions.secured = true;

    res.status(200).json({
      message: "Login successful",
      token,
    });
  }

  if (req.body.username) {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(
        new AppError("Email and/or Password fields can not be empty", 422)
      );
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return next(
        new AppError(
          "User does not exist, please reconfirm your credentials",
          400
        )
      );
    }

    if (user.otpVerified !== true) {
      return next(
        new AppError(
          "You have not verified your account, please check your mail for verification code or link",
          400
        )
      );
    }

    if (!(await user.correctPassword(password, user.password))) {
      return next(new AppError("Email and Password do not match", 400));
    }

    const token = signedToken(user.id);

    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    res.cookie("jwt", token, cookieOptions);

    if (process.env.NODE_ENV === "production") cookieOptions.secured = true;

    res.status(200).json({
      message: "Login successful",
      token,
    });
  }
});

exports.privateRoute = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not authorized", 403));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError("Token does not belong to any user", 403));
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You are not authorized to access this resource", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Email field can not be empty", 422));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new AppError("User does not exist, please recheck your mail address")
    );
  }

  const resetPasswordToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/change-password/${resetPasswordToken}`;

  try {
    await new emailHandler(user, resetURL).sendPasswordResetEmail();

    res.status(200).json({
      status: "success",
      message: "Email has been sent",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("Email not sent please retry", 500));
  }
});

exports.changePassword = catchAsync(async (req, res, next) => {
  let token = req.body.token;

  if (!token) {
    return next(new AppError("Token is required", 422));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired"));
  }

  // save new password
  user.password = req.body.password;
  user.confirm_password = req.body.confirm_password;
  user.passwordResetExpiresIn = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});
