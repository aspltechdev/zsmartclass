const express = require("express");
const router = express.Router();

const {
  register,
  verifyOTP,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  resendResetOTP
} = require("../controllers/auth.controller");

router.post("/register", register);

router.post("/verify-otp", verifyOTP);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetOTP);

router.post("/reset-password", resetPassword);

router.post("/reset-resend-otp", resendResetOTP);

module.exports = router;