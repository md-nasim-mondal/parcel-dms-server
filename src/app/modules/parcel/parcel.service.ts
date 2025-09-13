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
import {
  calculateParcelFee,
  expectedDeliveryDate,
  isValidStatusTransition,
  StatusTransitions,
} from "./parcel.utils";
import { Parcel } from "./parcel.model";
import { Types } from "mongoose";
import type { Document } from "mongoose";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { applyCoupon, validateCoupon } from "../coupon/coupon.utils";

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

  if (rest.couponCode) {
    await validateCoupon(rest.couponCode);
  }
  const calcParcelFeeWithoutDiscount = calculateParcelFee(
    weight,
    parcelType,
    shippingType
  );

  const finalFee = rest.couponCode
    ? await applyCoupon(rest.couponCode, calcParcelFeeWithoutDiscount)
    : calcParcelFeeWithoutDiscount;

  const estimatedDeliveryDate = expectedDeliveryDate(shippingType);

  const parcel = await Parcel.create({
    trackingId,
    type: parcelType,
    shippingType,
    weight,
    sender: senderId,
    receiver: receiver._id,
    fee: finalFee,
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

// <-------------------- ADMIN SERVICES ----------------------->

const getAllParcels = async (query: Record<string, string>) => {
  const parcelQuery = new QueryBuilder(
    Parcel.find()
      .populate("sender", "name email phone _id")
      .populate("receiver", "name email phone _id")
      .populate("statusLog.updatedBy", "name role _id")
      .populate("deliveryPersonnel", "name email phone _id"),
    query
  )
    .search(["trackingId", "name", "deliveryAddress", "pickupAddress"])
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

const updateParcelStatus = async (
  parcelId: string,
  adminId: string,
  payload: {
    currentStatus?: ParcelStatus;
    currentLocation?: string;
    deliveryPersonnelId?: string;
  }
) => {
  const parcel = await Parcel.findById(parcelId);

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (
    !payload.currentStatus &&
    !payload.currentLocation &&
    !payload.deliveryPersonnelId
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please provide at least one of currentStatus, currentLocation or deliveryPersonnelId"
    );
  }

  // check the status flow transition
  if (
    payload.currentStatus &&
    !isValidStatusTransition(parcel.currentStatus, payload.currentStatus)
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot transition from ${parcel.currentStatus} to ${
        payload.currentStatus
      }. Valid transitions: ${StatusTransitions[parcel.currentStatus].join(
        ", "
      )} from ${parcel.currentStatus}`
    );
  }

  // Update parcel status
  if (payload?.currentStatus) {
    if (payload.currentStatus === ParcelStatus.CANCELLED) {
      parcel.currentStatus = ParcelStatus.CANCELLED;
      parcel.cancelledAt = new Date();
    } else {
      parcel.cancelledAt = null;
    }

    if (payload.currentStatus === ParcelStatus.DELIVERED) {
      parcel.currentStatus = ParcelStatus.DELIVERED;
      parcel.deliveredAt = new Date();
      parcel.cancelledAt = null;
    } else {
      parcel.deliveredAt = null;
    }

    if (payload.currentStatus === ParcelStatus.BLOCKED) {
      parcel.isBlocked = true;
      parcel.currentStatus = ParcelStatus.BLOCKED;
      parcel.cancelledAt = null;
    }

    if (payload.currentStatus === ParcelStatus.APPROVED) {
      parcel.isBlocked = false;
      parcel.currentStatus = ParcelStatus.APPROVED;
      parcel.cancelledAt = null;
    }
    if (payload.currentStatus === ParcelStatus.RETURNED) {
      parcel.currentStatus = ParcelStatus.RETURNED;
      parcel.cancelledAt = null;
    }

    parcel.currentStatus = payload.currentStatus;

    addStatusLog(
      parcel,
      (payload.currentStatus || parcel.currentStatus) as ParcelStatus,
      new Types.ObjectId(adminId),
      payload?.currentLocation || (parcel?.currentLocation as string) || "",
      `Status updated by admin to ${parcel.currentStatus}`
    );
  }

  // Update current location if provided
  if (payload?.currentLocation) {
    parcel.currentLocation = payload.currentLocation;
  }

  if (payload.deliveryPersonnelId) {
    const deliveryPersonnelId = new Types.ObjectId(payload.deliveryPersonnelId);

    const deliveryPersonnel = await User.findById(deliveryPersonnelId);

    if (!deliveryPersonnel) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Delivery personnel not found."
      );
    }
    if (deliveryPersonnel.role !== Role.DELIVERY_PERSONNEL) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Provided ID is not a delivery personnel ID"
      );
    }

    // Check if personnel is active
    if (deliveryPersonnel.isActive !== IsActive.ACTIVE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Delivery personnel is ${deliveryPersonnel.isActive} and cannot be assigned`
      );
    }

    if (!deliveryPersonnel.isVerified) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Delivery personnel is not verified and cannot be assigned`
      );
    }

    // Check if current status allows delivery personnel assignment
    const validStatusesForPersonnelAssignment = [
      ParcelStatus.APPROVED,
      ParcelStatus.PICKED,
      ParcelStatus.DISPATCHED,
      ParcelStatus.IN_TRANSIT,
      ParcelStatus.RESCHEDULED,
    ];

    const finalStatus = payload.currentStatus || parcel.currentStatus;

    if (!validStatusesForPersonnelAssignment.includes(finalStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot assign delivery personnel when parcel status is ${finalStatus}. Valid statuses: ${validStatusesForPersonnelAssignment.join(
          ", "
        )}`
      );
    }

    if (
      Array.isArray(parcel.deliveryPersonnel) &&
      !parcel.deliveryPersonnel.includes(deliveryPersonnelId)
    ) {
      parcel.deliveryPersonnel.push(deliveryPersonnelId);
    }
  }

  await parcel.save();

  return parcel;
};

const blockStatusParcel = async (
  parcelId: string,
  adminId: string,
  payload: {
    reason?: string;
    isBlocked: boolean;
  }
) => {
  const parcel = await Parcel.findById(parcelId);

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  // check payload status and isBlocked same
  if (parcel.isBlocked === payload.isBlocked) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Parcel is already in this ${
        payload.isBlocked ? "blocked" : "unblocked"
      } status`
    );
  }

  parcel.isBlocked = payload.isBlocked;

  if (payload.isBlocked) {
    parcel.currentStatus = ParcelStatus.BLOCKED;
  } else {
    parcel.currentStatus = ParcelStatus.APPROVED;
  }

  addStatusLog(
    parcel,
    payload.isBlocked ? ParcelStatus.BLOCKED : ParcelStatus.APPROVED,
    new Types.ObjectId(adminId),
    (parcel?.currentLocation as string) || "",
    payload.reason || "Parcel blocked by admin."
  );

  await parcel.save();

  return parcel;
};

const createParcelByAdmin = async (payload: ICreateParcel, adminId: string) => {
  const trackingId = generateTrackingId();

  const {
    weight,
    senderEmail,
    receiverEmail,
    pickupAddress,
    deliveryAddress,
    ...rest
  } = payload;

  // Sender validation
  const sender = await User.findOne({ email: senderEmail });

  if (!sender) {
    throw new AppError(httpStatus.BAD_REQUEST, "Sender account is not found");
  }
  if (!sender?.phone) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please request sender to update their phone number in their profile."
    );
  }

  if (sender.role !== Role.SENDER) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not a sender");
  }

  if (!sender.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Sender is not verified");
  }

  if (
    sender.isActive === IsActive.BLOCKED ||
    sender.isActive === IsActive.INACTIVE
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, `Sender is ${sender.isActive}.`);
  }
  if (sender.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, `Sender is deleted.`);
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

  if (rest.couponCode) {
    await validateCoupon(rest.couponCode);
  }
  const calcParcelFeeWithoutDiscount = calculateParcelFee(
    weight,
    parcelType,
    shippingType
  );

  const finalFee = rest.couponCode
    ? await applyCoupon(rest.couponCode, calcParcelFeeWithoutDiscount)
    : calcParcelFeeWithoutDiscount;

  const estimatedDeliveryDate = expectedDeliveryDate(shippingType);

  const parcel = await Parcel.create({
    trackingId,
    type: parcelType,
    shippingType,
    weight,
    sender: sender._id,
    receiver: receiver._id,
    fee: finalFee,
    currentStatus: ParcelStatus.REQUESTED,
    statusLog: [
      {
        status: ParcelStatus.REQUESTED,
        location: senderAddress,
        note: "Parcel request created by Admin",
        timestamp: new Date(),
        updatedBy: new Types.ObjectId(adminId),
      },
    ],
    pickupAddress: senderAddress,
    deliveryAddress: receiverAddress,
    estimatedDelivery: estimatedDeliveryDate,
    couponCode: rest.couponCode,
    ...rest,
  });

  return parcel;
};

const getParcelById = async (parcelId: string) => {
  const parcel = await Parcel.findById(parcelId)
    .populate("sender", "name email phone _id")
    .populate("receiver", "name email phone _id")
    .populate("statusLog.updatedBy", "name role _id")
    .populate("deliveryPersonnel", "name email phone _id");

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  return parcel;
};

// <------------------- PARCEL PUBLIC SERVICES ------------------->

const getParcelByTrackingId = async (trackingId: string) => {
  const parcel = await Parcel.findOne({ trackingId })
    .select(
      "trackingId currentStatus estimatedDelivery statusLog.status statusLog.location statusLog.note statusLog.updatedBy statusLog.updatedAt pickupAddress deliveryAddress deliveredAt"
    )
    .populate("statusLog.updatedBy", "name role -_id");

  if (!parcel) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Parcel not found with this tracking ID"
    );
  }

  // Return limited public information
  return {
    trackingId: parcel.trackingId,
    currentStatus: parcel.currentStatus,
    estimatedDelivery: parcel.estimatedDelivery,
    deliveredAt: parcel.deliveredAt,
    statusLog: parcel.statusLog,
    pickupAddress: parcel.pickupAddress,
    deliveryAddress: parcel.deliveryAddress,
    createdAt: parcel.createdAt,
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

  // Admin Services
  getAllParcels,
  updateParcelStatus,
  blockStatusParcel,
  createParcelByAdmin,
  getParcelById,

  // Public Services
  getParcelByTrackingId,

  // Shared Services
  getParcelWithTrackingHistory,
};
