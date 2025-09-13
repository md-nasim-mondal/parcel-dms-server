import { z } from "zod";
import { ParcelStatus, ParcelType, ShippingType } from "./parcel.interface";
import { Types } from "mongoose";

// For Parcel sender
export const createParcelZodSchema = z.object({
  type: z.enum(Object.values(ParcelType) as [string]).optional(),
  shippingType: z.enum(Object.values(ShippingType) as [string]).optional(),
  weight: z
    .number({ error: "Weight must be a number" })
    .min(0.1, { message: "Weight must be at least 0.1 kg" })
    .max(10, { message: "Weight cannot exceed 10 kg" }),
  couponCode: z
    .string({ error: "Coupon code must be a string" })
    .max(20, { message: "Coupon code cannot exceed 20 characters" })
    .optional(),
  receiverEmail: z
    .string({ error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  pickupAddress: z
    .string({ error: "Pickup address must be string" })
    .max(100, { message: "Pickup address cannot exceed 100 characters." })
    .optional(),
  deliveryAddress: z
    .string({ error: "Delivery address must be string" })
    .max(100, { message: "Delivery address cannot exceed 100 characters." })
    .optional(),
});

// For admin
export const createParcelByAdminZodSchema = createParcelZodSchema.extend({
  senderEmail: z
    .string({ error: "Email must be string" })
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
});

// StatusLog schema
const StatusLogSchema = z.object({
  status: z.enum(Object.values(ParcelStatus) as [string]),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  updatedBy: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), "Invalid user id")
    .optional(),
});

// Admin Update Parcel
export const updateParcelSchemaAdmin = z.object({
  trackingId: z.string().optional(),
  type: z.enum(Object.values(ParcelType) as [string]).optional(),
  shippingType: z.enum(Object.values(ShippingType) as [string]).optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  fee: z.number().optional(),
  couponCode: z.string().nullable().optional(),
  estimatedDelivery: z.date().nullable().optional(),
  currentStatus: z.enum(Object.values(ParcelStatus) as [string]).optional(),
  currentLocation: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  sender: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), "Invalid sender id")
    .optional(),
  receiver: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), "Invalid receiver id")
    .optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryPersonnel: z
    .array(
      z
        .string()
        .refine((val) => Types.ObjectId.isValid(val), "Invalid personnel id")
    )
    .optional(),
  statusLog: z.array(StatusLogSchema).optional(),
  deliveredAt: z.date().nullable().optional(),
  cancelledAt: z.date().nullable().optional(),
});

export const updateStatusPersonnelSchema = z.object({
  currentStatus: z.enum(Object.values(ParcelStatus) as [string]).optional(),
  currentLocation: z.string().nullable().optional(),
  deliveryPersonnelId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), "Invalid personnel id")
    .optional(),
});

export const updateBlockedStatusSchema = z.object({
  isBlocked: z.boolean({
    error: "isBlocked must be true or false",
  }),
  reason: z.string().optional(),
});
