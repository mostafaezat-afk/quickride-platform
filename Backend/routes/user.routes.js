const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { body } = require("express-validator");
const { authUser } = require("../middlewares/auth.middleware");

router.post("/register",
    body("password").isLength({ min: 6 }).withMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    body("fullname.firstname").isLength({ min: 2 }).withMessage("الاسم يجب أن يكون حرفين على الأقل"),
    body("phone").isLength({ min: 10 }).withMessage("رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
    userController.registerUser
);

router.post("/login",
    body("phone").notEmpty().withMessage("رقم الهاتف مطلوب"),
    body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
    userController.loginUser
);

router.post("/update", authUser,
    body("fullname.firstname").isLength({ min: 2 }).withMessage("الاسم يجب أن يكون حرفين على الأقل"),
    userController.updateUserProfile
);

router.get("/profile", authUser, userController.userProfile);

router.get("/logout", authUser, userController.logoutUser);

module.exports = router;
