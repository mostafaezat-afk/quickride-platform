const express = require("express");
const router = express.Router();
const captainController = require("../controllers/captain.controller");
const { body } = require("express-validator");
const { authCaptain } = require("../middlewares/auth.middleware");

router.post("/register",
    body("password").isLength({ min: 6 }).withMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    body("phone").isLength({ min: 10 }).withMessage("رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
    body("fullname.firstname").isLength({ min: 2 }).withMessage("الاسم يجب أن يكون حرفين على الأقل"),
    captainController.registerCaptain
);

router.post("/login",
    body("phone").notEmpty().withMessage("رقم الهاتف مطلوب"),
    body("password").notEmpty().withMessage("كلمة المرور مطلوبة"),
    captainController.loginCaptain
);

router.post("/update",
    body("captainData.fullname.firstname").isLength({ min: 2 }).withMessage("الاسم يجب أن يكون حرفين على الأقل"),
    authCaptain,
    captainController.updateCaptainProfile
);

router.get("/profile", authCaptain, captainController.captainProfile);

router.get("/logout", authCaptain, captainController.logoutCaptain);

module.exports = router;
