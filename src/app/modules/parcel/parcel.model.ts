import { Schema, model } from "mongoose";
import {
  IParcel,
  IStatusLog,
  ParcelStatus,
  ParcelType,
  ShippingType,
} from "./parcel.interface";

const statusLogSchema = new Schema<IStatusLog>(
  {
    status: {
      type: String,
      enum: Object.values(ParcelStatus),
      required: true,
    },
    location: {
      type: String,
      max: 200,
    },
    note: {
      type: String,
      max: 500,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
    timestamps: true,
    versionKey: false,
  }
);

const parcelSchema = new Schema<IParcel>(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ParcelType),
      default: ParcelType.PACKAGE,
    },
    shippingType: {
      type: String,
      enum: Object.values(ShippingType),
      default: ShippingType.STANDARD,
    },
    weight: {
      type: Number,
      min: 0.1,
      max: 10,
    },
    weightUnit: {
      type: String,
      default: "kg",
    },
    fee: {
      type: Number,
      min: 110,
      default: 120,
      required: true,
    },
    couponCode: {
      type: String,
      max: 20,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    currentStatus: {
      type: String,
      enum: Object.values(ParcelStatus),
      default: ParcelStatus.REQUESTED,
      required: true,
    },
    currentLocation: {
      type: String,
      max: 200,
      default: null,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pickupAddress: {
      type: String,
      required: true,
      minlength: 5,
      max: 500,
    },
    deliveryAddress: {
      type: String,
      required: true,
      min: 5,
      max: 500,
    },
    statusLog: {
      type: [statusLogSchema],
      default: [],
    },
    deliveryPersonnel: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Parcel = model<IParcel>("Parcel", parcelSchema);
