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

const cancelParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const parcelId = req.params.id;
    const senderId = (req.user as JwtPayload).userId;
    const { note } = req.body || {};

    const result = await ParcelService.cancelParcel(senderId, parcelId, note);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel cancelled successfully",
      data: result,
    });
  }
);

const deleteParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const parcelId = req.params.id;
    const senderId = (req.user as JwtPayload).userId;

    const result = await ParcelService.deleteParcel(senderId, parcelId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel deleted successfully",
      data: result,
    });
  }
);

const getSenderParcels = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const senderId = (req.user as JwtPayload).userId;
    const query = req.query;

    const result = await ParcelService.getSenderParcels(
      senderId,
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Sender parcels retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getParcelWithHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = (req.user as JwtPayload).userId;

    const result = await ParcelService.getParcelWithTrackingHistory(id, userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel details with tracking history retrieved successfully",
      data: result,
    });
  }
);

// <-------------------- PARCEL RECEIVER CONTROLLERS -------------------->

const getIncomingParcels = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const receiverId = (req.user as JwtPayload).userId;
    const query = req.query;

    const result = await ParcelService.getIncomingParcels(
      receiverId,
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Incoming parcels retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const confirmDelivery = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const receiverId = (req.user as JwtPayload).userId;

    const result = await ParcelService.confirmDelivery(id, receiverId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel delivery confirmed successfully",
      data: result,
    });
  }
);

const getDeliveryHistory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const receiverId = (req.user as JwtPayload).userId;
    const query = req.query;

    const result = await ParcelService.getDeliveryHistory(
      receiverId,
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Delivery history retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

// <---------------PARCEL ADMIN CONTROLLERS --------------->

const getAllParcels = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;

    const result = await ParcelService.getAllParcels(
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All parcels retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const updateParcelStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminId = (req.user as JwtPayload).userId;

    const result = await ParcelService.updateParcelStatus(
      id,
      adminId,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel status or delivery personnel updated successfully",
      data: result,
    });
  }
);

const blockStatusParcel = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminId = (req.user as JwtPayload).userId;
    const { reason, isBlocked } = req.body;

    const result = await ParcelService.blockStatusParcel(id, adminId, {
      reason,
      isBlocked,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Parcel ${isBlocked ? "blocked" : "unblocked"} successfully`,
      data: result,
    });
  }
);

const createParcelByAdmin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const adminId = (req.user as JwtPayload).userId;
    const parcel = await ParcelService.createParcelByAdmin(req.body, adminId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Parcel created successfully",
      data: parcel,
    });
  }
);

const getParcelById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await ParcelService.getParcelById(id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel details retrieved successfully",
      data: result,
    });
  }
);

// <------------------ PARCEL PUBLIC CONTROLLERS ------------------>

const getParcelByTrackingId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { trackingId } = req.params;

    const result = await ParcelService.getParcelByTrackingId(trackingId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Parcel tracking information retrieved successfully",
      data: result,
    });
  }
);

export const ParcelController = {
  // Parcel Sender Controller
  createParcel,
  cancelParcel,
  deleteParcel,
  getSenderParcels,

  // Parcel Receiver Controllers
  getIncomingParcels,
  confirmDelivery,
  getDeliveryHistory,

  //Parcel Admin Controllers
  getAllParcels,
  updateParcelStatus,
  blockStatusParcel,
  createParcelByAdmin,
  getParcelById,

  //Parcel Public Controllers
  getParcelByTrackingId,

  //Parcel Shared Controllers
  getParcelWithHistory,
};
