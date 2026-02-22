const captainModel = require("../models/captain.model");

module.exports.createCaptain = async (
  firstname,
  lastname,
  phone,
  password,
  color,
  number,
  capacity,
  type
) => {
  if (!firstname || !phone || !password) {
    throw new Error("جميع الحقول مطلوبة");
  }

  const hashedPassword = await captainModel.hashPassword(password);

  const captain = await captainModel.create({
    fullname: {
      firstname,
      lastname,
    },
    phone,
    password: hashedPassword,
    vehicle: {
      color,
      number,
      capacity,
      type,
    },
  });

  return captain;
};
