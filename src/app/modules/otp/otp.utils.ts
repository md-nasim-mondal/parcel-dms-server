import crypto from "crypto";

export const OTP_EXPIRATION = 3 * 60; // 3minute

export const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
  return otp;
};