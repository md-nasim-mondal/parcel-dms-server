/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import type { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import type { JwtPayload } from "jsonwebtoken";
import { ParcelService } from "./parcel.service";
import { sendResponse } from "../../utils/sendResponse";

const createParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const senderId = (req.user as JwtPayload).userId;

    const parcel = await ParcelService.createParcel(req.body, senderId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Parcel delivery request created successfully",
      data: parcel,
    });
  }
);

export const ParcelController = {
  // Parcel Sender Controller
  createParcel,
};
