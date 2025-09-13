import  httpStatus from "http-status-codes";



// <-------------------- Sender Related Parcel Services ---------------->

import AppError from "../../errorHelpers/AppError";
import { generateTrackingId } from "../../utils/generateTrackingId";
import { User } from "../user/user.model";
import { ParcelStatus, ParcelType, ShippingType, type ICreateParcel } from "./parcel.interface";
import { IsActive, Role } from "../user/user.interface";
import { calculateParcelFee, expectedDeliveryDate } from "./parcel.utils";
import { Parcel } from "./parcel.model";
import { Types } from "mongoose";

// For Parcel Sender Related Services
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


export const ParcelService = {
    // Sender Services
    createParcel
}