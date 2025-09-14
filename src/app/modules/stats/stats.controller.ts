// controllers/stats.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getUserStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User stats fetched successfully",
    data: stats,
  });
});

const getParcelsStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await StatsService.getParcelsStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Parcel stats fetched successfully",
    data: stats,
  });
});

export const StatsController = {
  getParcelsStats,
  getUserStats,
};
