import { z } from "zod";
import { DiscountType } from "./coupon.interface";
import {
  ParcelStatus,
  ParcelType,
  ShippingType,
} from "../parcel/parcel.interface";
import { Types } from "mongoose";
import { createParcelZodSchema } from "../parcel/parcel.validation";

// ----------------- Coupon Schema (Sender Only) -----------------
export const createCouponZodSchema = z.object({
  discountType: z
    .enum([...Object.values(DiscountType)] as [string, ...string[]], {
      message: "Discount type must be either 'percentage' or 'fixed'",
    })
    .refine((val) => val !== undefined, {
      message: "Discount type is required",
    }),

  discountValue: z
    .number()
    .refine((val) => typeof val === "number", {
      message: "Discount value must be a number",
    }),

  expiresAt: z
    .string()
    .min(1, { message: "Expiry date is required" })
    .datetime({ message: "Invalid date format. Use ISO 8601 format" })
    .refine((date) => new Date(date) > new Date(), {
      message: "Expiry date must be in the future",
    }),

  isActive: z.boolean().optional().default(true),

  usageLimit: z
    .number()
    .int({ message: "Usage limit must be an integer" })
    .min(1, { message: "Usage limit must be at least 1" })
    .max(10000, { message: "Usage limit cannot exceed 10,000" })
    .optional(),

  usedCount: z
    .number()
    .int({ message: "Used count must be an integer" })
    .min(0, { message: "Used count cannot be negative" })
    .optional()
    .default(0),
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
