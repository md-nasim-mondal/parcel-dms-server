/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CouponService } from "./coupon.service";

const createCoupon = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const coupon = await CouponService.createCoupon(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Coupon Created Successfully",
      data: coupon,
    });
  }
);

export const CouponController = {
  createCoupon: createCoupon,
  // Other coupon related controllers can be added here
};
