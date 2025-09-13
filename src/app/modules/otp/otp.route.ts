import express from "express";
import { OTPController } from "./otp.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { otpSendZodSchema, otpVerifyZodSchema } from "./otp.validation";

const router = express.Router();

router.post("/send", validateRequest(otpSendZodSchema), OTPController.sendOTP);
router.post("/verify", validateRequest(otpVerifyZodSchema), OTPController.verifyOTP);

export const OtpRoutes = router;