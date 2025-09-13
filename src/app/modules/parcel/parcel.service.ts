import httpStatus from "http-status-codes";

// <-------------------- Sender Related Parcel Services ---------------->

import AppError from "../../errorHelpers/AppError";
import { generateTrackingId } from "../../utils/generateTrackingId";
import { User } from "../user/user.model";
import {
  ParcelStatus,
  ParcelType,
  ShippingType,
  type ICreateParcel,
  type IParcel,
} from "./parcel.interface";
import { IsActive, Role } from "../user/user.interface";
import { calculateParcelFee, expectedDeliveryDate } from "./parcel.utils";
import { Parcel } from "./parcel.model";
import { Types } from "mongoose";
import type { Document } from "mongoose";
import { QueryBuilder } from "../../utils/QueryBuilder";

const addStatusLog = (
  parcel: Document<unknown, object, IParcel> & IParcel,
  status: ParcelStatus,
  updatedBy?: Types.ObjectId,
  location?: string,
  note?: string
) => {
  const statusLogEntry = {
    status,
    location: location || "",
    note: note || "Updated by System",
    updatedBy: updatedBy,
  };

  if (!parcel.statusLog) {
    parcel.statusLog = [];
  }
  parcel.statusLog.push(statusLogEntry);
};

// <--------------- PARCEL SENDER RELATED SERVICES --------------->
const createParcel = async (payload: ICreateParcel, senderId: string) => {
  const trackingId = generateTrackingId();

  const { weight, receiverEmail, pickupAddress, deliveryAddress, ...rest } =
    payload;

  //Parcel Sender validation
  const sender = await User.findById(senderId);
  if (!sender?.phone) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please Update your phone number in your profile."
    );
  }

  const senderAddress = pickupAddress || sender.defaultAddress;

  if (!senderAddress) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Pickup address is required or set a default address in your profile."
    );
  }

  // Receiver validation
  const receiver = await User.findOne({ email: receiverEmail });
  if (!receiver) {
    throw new AppError(httpStatus.BAD_REQUEST, "Receiver account is not found");
  }

  if (receiver.role !== Role.RECEIVER) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Provided user is not a receiver"
    );
  }

  if (!receiver.isVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Receiver is not verified, you cannot send parcel to this receiver"
    );
  }

  if (
    receiver.isActive === IsActive.BLOCKED ||
    receiver.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Receiver is ${receiver.isActive}. You cannot send parcel to this receiver`
    );
  }
  if (receiver.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Receiver is deleted. You cannot send parcel to this receiver`
    );
  }

  const receiverAddress = deliveryAddress || receiver.defaultAddress;

  if (!receiverAddress) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Delivery address is required or request receiver to add a default address in their profile."
    );
  }
  const parcelType = rest.type || ParcelType.PACKAGE;
  const shippingType = rest.shippingType || ShippingType.STANDARD;

  //   if (rest.couponCode) {
  //     await validateCoupon(rest.couponCode);
  //   }
  const calcParcelFeeWithoutDiscount = calculateParcelFee(
    weight,
    parcelType,
    shippingType
  );

  //   const finalFee = rest.couponCode
  //     ? await applyCoupon(rest.couponCode, calcParcelFeeWithoutDiscount)
  //     : calcParcelFeeWithoutDiscount;

  const estimatedDeliveryDate = expectedDeliveryDate(shippingType);

  const parcel = await Parcel.create({
    trackingId,
    type: parcelType,
    shippingType,
    weight,
    sender: senderId,
    receiver: receiver._id,
    fee: calcParcelFeeWithoutDiscount,
    currentStatus: ParcelStatus.REQUESTED,
    statusLog: [
      {
        status: ParcelStatus.REQUESTED,
        location: senderAddress,
        note: "Parcel request created by sender",
        timestamp: new Date(),
        updatedBy: new Types.ObjectId(senderId),
      },
    ],
    pickupAddress: senderAddress,
    deliveryAddress: receiverAddress,
    estimatedDelivery: estimatedDeliveryDate,
    couponCode: rest.couponCode,
    ...rest,
  });

  // Fetch the created parcel with excluded fields for privacy
  const cleanParcel = await Parcel.findById(parcel._id)
    .select("-receiver -statusLog._id -deliveryPersonnel -isBlocked")
    .populate("sender", "name email phone _id")
    .populate("receiver", "name email phone -_id")
    .populate("statusLog.updatedBy", "name role -_id");

  return cleanParcel;
};

const cancelParcel = async (senderId: string, id: string, note?: string) => {
  const parcel = await Parcel.findById(id);

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  // Check if sender owns this parcel
  if (parcel.sender.toString() !== senderId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to cancel this parcel"
    );
  }

  // check if parcel is already delivered or cancelled
  if (parcel.currentStatus === ParcelStatus.CANCELLED) {
    throw new AppError(httpStatus.BAD_REQUEST, "Parcel is already cancelled");
  }

  if (
    parcel.currentStatus === ParcelStatus.DELIVERED ||
    parcel.currentStatus === ParcelStatus.DISPATCHED ||
    parcel.currentStatus === ParcelStatus.IN_TRANSIT
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parcel cannot be cancelled at this stage"
    );
  }

  if (
    parcel.currentStatus === ParcelStatus.BLOCKED ||
    parcel.currentStatus === ParcelStatus.FLAGGED
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Cannot cancel blocked or flagged parcel"
    );
  }

  // Update parcel status and add tracking event
  parcel.currentStatus = ParcelStatus.CANCELLED;
  parcel.estimatedDelivery = null;
  parcel.deliveredAt = null;
  parcel.cancelledAt = new Date();

  addStatusLog(
    parcel,
    ParcelStatus.CANCELLED,
    new Types.ObjectId(senderId),
    parcel?.pickupAddress as string,
    note
  );

  await parcel.save();

  // Fetch the created parcel with excluded fields
  const cleanParcel = await Parcel.findById(parcel._id)
    .select("-receiver -statusLog._id -deliveryPersonnel -isBlocked")
    .populate("sender", "name email phone _id")
    .populate("receiver", "name email phone -_id")
    .populate("statusLog.updatedBy", "name role -_id");

  return cleanParcel;
};

const deleteParcel = async (senderId: string, parcelId: string) => {
  const parcel = await Parcel.findById(parcelId);
  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }
  // Check if sender owns this parcel
  if (parcel.sender.toString() !== senderId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this parcel"
    );
  }

  // find and delete the parcel only if it is cancelled or requested
  if (
    parcel.currentStatus !== ParcelStatus.CANCELLED &&
    parcel.currentStatus !== ParcelStatus.REQUESTED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parcel must be cancelled before deletion"
    );
  }
  await Parcel.findByIdAndDelete(parcelId);
};

const getSenderParcels = async (
  senderId: string,
  query: Record<string, string>
) => {
  const parcelQuery = new QueryBuilder(
    Parcel.find({ sender: senderId })
      .select("-receiver -statusLog._id -deliveryPersonnel -isBlocked")
      .populate("sender", "name email phone _id")
      .populate("receiver", "name email phone -_id")
      .populate("statusLog.updatedBy", "name role -_id"),
    query
  )
    .search(["trackingId", "deliveryAddress", "pickupAddress"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.modelQuery;
  const meta = await parcelQuery.getMeta();

  return {
    data: parcels,
    meta,
  };
};

const getParcelWithTrackingHistory = async (
  parcelId: string,
  userId: string
) => {
  const parcel = await Parcel.findById(parcelId);

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  // Authorization check
  const isOwner =
    parcel.sender._id.toString() === userId ||
    parcel.receiver._id.toString() === userId;

  if (!isOwner) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this parcel"
    );
  }

  const cleanParcel = await Parcel.findById(parcel._id)
    .select(
      "-type -weight -weightUnit -shippingType -fee -isPaid -isBlocked -couponCode -receiver -statusLog._id"
    )
    .populate("sender", "name email phone -_id")
    .populate("receiver", "name email phone -_id")
    .populate("statusLog.updatedBy", "name role -_id");

  return cleanParcel;
};

// <------------------PARCEL RECEIVER SERVICES ------------------->

const getIncomingParcels = async (
  receiverId: string,
  query: Record<string, string>
) => {
  const parcelQuery = new QueryBuilder(
    Parcel.find({
      receiver: receiverId,
      currentStatus: {
        $nin: [
          ParcelStatus.DELIVERED,
          ParcelStatus.FLAGGED,
          ParcelStatus.RETURNED,
          ParcelStatus.BLOCKED,
          ParcelStatus.CANCELLED,
        ],
      },
    })
      .select(
        "-weight -weightUnit -fee -couponCode -isPaid -isBlocked -sender -statusLog._id -statusLog.updatedBy -deliveryPersonnel"
      )
      .populate("sender", "name email phone -_id")
      .populate("receiver", "name email phone _id"),
    query
  )
    .search(["trackingId", "deliveryAddress", "pickupAddress"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.modelQuery;
  const meta = await parcelQuery.getMeta();

  return {
    data: parcels,
    meta,
  };
};

const confirmDelivery = async (parcelId: string, receiverId: string) => {
  const parcel = await Parcel.findOne({ _id: parcelId });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.receiver.toString() !== receiverId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to confirm this parcel"
    );
  }

  if (parcel.currentStatus !== ParcelStatus.IN_TRANSIT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parcel must be In-Transit to confirm delivery"
    );
  }

  // Update parcel status
  parcel.currentStatus = ParcelStatus.DELIVERED;
  parcel.deliveredAt = new Date();
  parcel.cancelledAt = null;

  addStatusLog(
    parcel,
    ParcelStatus.DELIVERED,
    new Types.ObjectId(receiverId),
    parcel?.deliveryAddress as string,
    "Parcel status updated to delivered by receiver"
  );

  await parcel.save();

  // Fetch the updated parcel with excluded fields for receiver
  const cleanParcel = await Parcel.findById(parcel._id)
    .select(
      "-_id -weight -weightUnit -fee -couponCode -isPaid -isBlocked -sender -receiver -statusLog._id -statusLog.updatedBy -deliveryPersonnel"
    )
    .populate("sender", "name email phone -_id");

  return cleanParcel;
};

const getDeliveryHistory = async (
  receiverId: string,
  query: Record<string, string>
) => {
  const parcelQuery = new QueryBuilder(
    Parcel.find({
      receiver: receiverId,
      currentStatus: {
        $in: [ParcelStatus.DELIVERED],
      },
    })
      .select(
        "-weight -weightUnit -fee -couponCode -isPaid -isBlocked -sender -receiver -statusLog._id -statusLog.updatedBy -deliveryPersonnel"
      )
      .populate("sender", "name email phone -_id")
      .populate("receiver", "name email phone"),
    query
  )
    .search(["trackingId", "deliveryAddress", "pickupAddress"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.modelQuery;
  const meta = await parcelQuery.getMeta();

  return {
    data: parcels,
    meta,
  };
};

export const ParcelService = {
  // Parcel Sender Services
  createParcel,
  cancelParcel,
  deleteParcel,
  getSenderParcels,

  // Receiver Services
  getIncomingParcels,
  confirmDelivery,
  getDeliveryHistory,

  // Shared Services
  getParcelWithTrackingHistory,
};
