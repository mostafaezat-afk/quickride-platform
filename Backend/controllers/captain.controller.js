const asyncHandler = require("express-async-handler");
const captainModel = require("../models/captain.model");
const captainService = require("../services/captain.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");

module.exports.registerCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { fullname, password, phone, vehicle } = req.body;

  try {
    const alreadyExists = await captainModel.findOne({ phone });

    if (alreadyExists) {
      return res.status(400).json({ message: "هذا الرقم مسجل بالفعل" });
    }

    const captain = await captainService.createCaptain(
      fullname.firstname,
      fullname.lastname,
      phone,
      password,
      vehicle.color,
      vehicle.number,
      vehicle.capacity,
      vehicle.type
    );

    const token = captain.generateAuthToken();
    res
      .status(201)
      .json({ message: "تم تسجيل السائق بنجاح", token, captain });
  } catch (error) {
    console.error("Captain registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "هذا الرقم مسجل بالفعل" });
    }
    return res.status(500).json({ message: "حدث خطأ أثناء التسجيل: " + (error.message || "خطأ غير معروف") });
  }
});

module.exports.loginCaptain = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { phone, password } = req.body;

  const captain = await captainModel.findOne({ phone }).select("+password");
  if (!captain) {
    return res.status(404).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
  }

  const isMatch = await captain.comparePassword(password);

  if (!isMatch) {
    return res.status(404).json({ message: "رقم الهاتف أو كلمة المرور غير صحيحة" });
  }

  const token = captain.generateAuthToken();
  res.cookie("token", token);
  res.json({ message: "تم تسجيل الدخول بنجاح", token, captain });
});

module.exports.captainProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ captain: req.captain });
});

module.exports.updateCaptainProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { captainData } = req.body;
  const updatedCaptainData = await captainModel.findOneAndUpdate(
    { _id: req.captain._id },
    captainData,
    { new: true }
  );

  res.status(200).json({
    message: "تم تحديث الملف الشخصي بنجاح",
    user: updatedCaptainData,
  });
});

module.exports.logoutCaptain = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  const token = req.cookies.token || req.headers.token;

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
});
