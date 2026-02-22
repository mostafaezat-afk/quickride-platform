const asyncHandler = require("express-async-handler");
const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");

module.exports.registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, password, phone } = req.body;

  try {
    const alreadyExists = await userModel.findOne({ phone });

    if (alreadyExists) {
      return res.status(400).json({ message: "هذا الرقم مسجل بالفعل" });
    }

    const user = await userService.createUser(
      fullname.firstname,
      fullname.lastname,
      phone,
      password
    );

    const token = user.generateAuthToken();
    res
      .status(201)
      .json({ message: "تم التسجيل بنجاح", token, user });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "هذا الرقم مسجل بالفعل" });
    }
    return res.status(500).json({ message: "حدث خطأ أثناء التسجيل: " + (error.message || "خطأ غير معروف") });
  }
});

module.exports.loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { phone, password } = req.body;

  const user = await userModel.findOne({ phone }).select("+password");
  if (!user) {
    return res.status(404).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
  }

  const token = user.generateAuthToken();
  res.cookie("token", token);

  res.json({
    message: "تم تسجيل الدخول بنجاح",
    token,
    user: {
      _id: user._id,
      fullname: {
        firstname: user.fullname.firstname,
        lastname: user.fullname.lastname,
      },
      phone: user.phone,
      rides: user.rides,
      socketId: user.socketId,
    },
  });
});

module.exports.userProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports.updateUserProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, phone } = req.body;

  const updatedUserData = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      fullname: fullname,
      phone,
    },
    { new: true }
  );

  res
    .status(200)
    .json({ message: "تم تحديث الملف الشخصي بنجاح", user: updatedUserData });
});

module.exports.logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
});
