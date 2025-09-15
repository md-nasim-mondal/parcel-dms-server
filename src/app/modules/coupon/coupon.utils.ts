import { StatusCodes } from "http-status-codes";
import { Coupon } from "./coupon.model";
import { DiscountType } from "./coupon.interface";
import AppError from "../../errorHelpers/AppError";

export function generateCouponCode(length = 8) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let coupon = "";
  for (let i = 0; i < length; i++) {
    coupon += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return coupon.toUpperCase();
}

export async function validateCoupon(code: string) {
  const coupon = await Coupon.findOne({ code: code });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, message: "Coupon is not active" };
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, message: "Coupon has expired" };
  }

  if (coupon?.usageLimit && (coupon?.usedCount ?? 0) >= coupon?.usageLimit) {
    return { valid: false, message: "Coupon has reached its usage limit" };
  }

  return { valid: true, coupon: coupon };
}

export async function applyCoupon(couponCode: string, fee: number) {
  const { valid, coupon, message } = await validateCoupon(couponCode);

  if (!valid) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      message || "Invalid coupon code"
    );
  }

  if (coupon?.discountType === DiscountType.PERCENTAGE) {
    fee -= fee * (coupon.discountValue / 100);
  } else if (coupon?.discountType === DiscountType.FIXED) {
    fee -= coupon.discountValue;
  }

  // Update coupon usage
  if (coupon && typeof coupon.usedCount === "number") {
    coupon.usedCount++;
    await coupon.save();
  }

  // Ensure fee does not go below a minimum threshold
  const MINIMUM_FEE = 50;
  if (fee < MINIMUM_FEE) {
    fee = MINIMUM_FEE;
  }

  return fee;
}
