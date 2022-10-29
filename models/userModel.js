const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, "First name is required"],
  },
  last_name: {
    type: String,
    required: [true, "Last name is required"],
  },
  middle_name: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email has been taken"],
    validate: [validator.isEmail, "Please provide a valid Email Address"],
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: [true, "Username has been taken"],
    minlength: [3, "Username must have at least 5 characters"],
    maxlength: [30, "Username can not be more than 30 characters"],
  },
  avatar: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin"],
      message: "You can only be an admin or a user",
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    select: false,
  },
  confirm_password: {
    type: String,
    required: [true, "Password confirm is required"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password confirm must be same as password",
    },
  },
  otp: {
    type: String,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// encrypt password before we save it
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirm_password = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// compare password when attempting to login
userSchema.methods.correctPassword = async function (
  requestPassword,
  userPassword
) {
  return bcrypt.compare(requestPassword, userPassword);
};

// generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpiresIn = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
