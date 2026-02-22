const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const captainSchema = new mongoose.Schema(
  {
    fullname: {
      firstname: {
        type: String,
        required: true,
        minlength: 2,
      },
      lastname: {
        type: String,
      },
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 15,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    socketId: {
      type: String,
    },
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ride",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    vehicle: {
      color: {
        type: String,
        required: true,
        minlength: [2, "يجب أن يكون اللون حرفين على الأقل"],
      },
      number: {
        type: String,
        required: true,
        minlength: [2, "يجب أن يكون رقم اللوحة حرفين على الأقل"],
      },
      capacity: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["car", "bike", "auto", "tuktuk", "torsicle", "delivery"],
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

captainSchema.index({ location: "2dsphere" });

captainSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

captainSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, userType: "captain" },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    }
  );
};

captainSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Captain", captainSchema);
