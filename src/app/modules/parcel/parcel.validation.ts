import { z } from "zod";
import { ParcelStatus, ParcelType, ShippingType } from "./parcel.interface";
import { Types } from "mongoose";

// ----------------- Parcel Schema (Sender Only) -----------------
export const createParcelZodSchema = z.object({
  type: z.enum(Object.values(ParcelType) as [string]).optional(),
  shippingType: z.enum(Object.values(ShippingType) as [string]).optional(),

  weight: z
    .number()
    .min(0.1, { message: "Weight must be at least 0.1 kg" })
    .max(10, { message: "Weight cannot exceed 10 kg" })
    .refine((val) => typeof val === "number", {
      message: "Weight must be a number",
    }),

  couponCode: z
    .string()
    .max(20, { message: "Coupon code cannot exceed 20 characters" })
    .optional(),

  receiverEmail: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Invalid email address format." })
    .refine((val) => typeof val === "string", {
      message: "Email must be string",
    }),

  pickupAddress: z
    .string()
    .max(100, { message: "Pickup address cannot exceed 100 characters" })
    .optional(),

  deliveryAddress: z
    .string()
    .max(100, { message: "Delivery address cannot exceed 100 characters" })
    .optional(),
});

// ----------------- Parcel Schema (Admin Create) -----------------
export const createParcelByAdminZodSchema = createParcelZodSchema.extend({
  senderEmail: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Invalid email address format." })
    .refine((val) => typeof val === "string", {
      message: "Email must be string",
    }),
});

// ----------------- Status Log Schema -----------------
const StatusLogSchema = z.object({
  status: z.enum(Object.values(ParcelStatus) as [string], {
    message: "Invalid status value",
  }),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  updatedBy: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid user id",
    })
    .optional(),
});

// ----------------- Parcel Update Schema (Admin) -----------------
export const updateParcelSchemaAdmin = z.object({
  trackingId: z.string().optional(),
  type: z
    .enum(Object.values(ParcelType) as [string], { message: "Invalid type" })
    .optional(),
  shippingType: z
    .enum(Object.values(ShippingType) as [string], {
      message: "Invalid shipping type",
    })
    .optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  fee: z.number().optional(),
  couponCode: z.string().nullable().optional(),
  estimatedDelivery: z.date().nullable().optional(),
  currentStatus: z
    .enum(Object.values(ParcelStatus) as [string], {
      message: "Invalid status",
    })
    .optional(),
  currentLocation: z.string().nullable().optional(),
  isPaid: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  sender: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid sender id",
    })
    .optional(),
  receiver: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid receiver id",
    })
    .optional(),
  pickupAddress: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryPersonnel: z
    .array(
      z
        .string()
        .refine((val) => Types.ObjectId.isValid(val), {
          message: "Invalid personnel id",
        })
    )
    .optional(),
  statusLog: z.array(StatusLogSchema).optional(),
  deliveredAt: z.date().nullable().optional(),
  cancelledAt: z.date().nullable().optional(),
});

// ----------------- Update Status Schema (Personnel) -----------------
export const updateStatusPersonnelSchema = z.object({
  currentStatus: z
    .enum(Object.values(ParcelStatus) as [string], {
      message: "Invalid status",
    })
    .optional(),
  currentLocation: z.string().nullable().optional(),
  deliveryPersonnelId: z
    .string()
    .refine((val) => Types.ObjectId.isValid(val), {
      message: "Invalid personnel id",
    })
    .optional(),
});

// ----------------- Update Blocked Status Schema -----------------
export const updateBlockedStatusSchema = z.object({
  isBlocked: z.boolean().refine((val) => typeof val === "boolean", {
    message: "isBlocked must be true or false",
  }),
  reason: z.string().optional(),
});
