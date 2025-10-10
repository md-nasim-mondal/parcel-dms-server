// controllers/stats.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";
import type { JwtPayload } from "jsonwebtoken";

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

const getSenderStats = catchAsync(async (req: Request, res: Response) => {
  const senderId = (req.user as JwtPayload).userId;
  const stats = await StatsService.getSenderStats(senderId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Sender stats fetched successfully",
    data: stats,
  });
});

const getReceiverStats = catchAsync(async (req: Request, res: Response) => {
  const receiverId = (req.user as JwtPayload).userId;
  const stats = await StatsService.getReceiverStats(receiverId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Receiver stats fetched successfully",
    data: stats,
  });
});

export const StatsController = {
  // system stats for admin
  getParcelsStats,
  getUserStats,
  // receiver stats for receiver
  getReceiverStats,
  // sender stats for sender
  getSenderStats,
};
