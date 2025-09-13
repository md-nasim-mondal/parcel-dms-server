import httpStatus from "http-status-codes";
import { Coupon } from "./coupon.model";
import { DiscountType, ICoupon } from "./coupon.interface";
import { generateCouponCode } from "./coupon.utils";
import AppError from "../../errorHelpers/AppError";

const createCoupon = async (payload: ICoupon) => {
    const { discountType, discountValue, expiresAt, ...rest } = payload;

    const generateCode = generateCouponCode();

    // Validate discount value based on discount type
    if (discountType === DiscountType.PERCENTAGE && (discountValue < 0 || discountValue > 100)) {
        throw new AppError(httpStatus.BAD_REQUEST, "Percentage discount value must be between 0 and 100");
    }
    if (discountType === DiscountType.FIXED && discountValue < 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Fixed discount value must be a positive number");
    }
    // Validate expiration date
    if (expiresAt && new Date(expiresAt) <= new Date()) {
        throw new AppError(httpStatus.BAD_REQUEST, "Expiration date must be in the future");
    }

    const coupon = await Coupon.create({
        code: generateCode,
        discountType,
        discountValue,
        expiresAt,
        ...rest
    })

    return coupon
}

export const CouponService = {
    createCoupon: createCoupon,
    // Other coupon related services can be added here
};