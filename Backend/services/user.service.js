const userModel = require("../models/user.model");

module.exports.createUser = async (firstname, lastname, phone, password) => {
  if (!firstname || !phone || !password) {
    throw new Error("جميع الحقول مطلوبة");
  }

  const hashedPassword = await userModel.hashPassword(password);

  const user = await userModel.create({
    fullname: {
      firstname,
      lastname,
    },
    phone,
    password: hashedPassword,
  });

  return user;
};
