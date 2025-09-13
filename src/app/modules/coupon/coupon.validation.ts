import { z } from "zod";
import { DiscountType } from "./coupon.interface";
import { ParcelStatus, ParcelType, ShippingType } from "../parcel/parcel.interface";
import { Types } from "mongoose";
import { createParcelZodSchema } from "../parcel/parcel.validation";

// Only For Sender
export const createCouponZodSchema = z.object({
    discountType: z.enum([...Object.values(DiscountType)] as [string, ...string[]], {
      message: "Discount type must be either 'percentage' or 'fixed'"
    }).refine((val) => val !== undefined, {
      message: "Discount type is required"
    }),
    discountValue: z
      .number({ 
        error: "Discount value is required",
        message: "Discount value must be a number"
      }),
    expiresAt: z
      .string()
      .min(1, { message: "Expiry date is required" })
      .datetime({ message: "Invalid date format. Use ISO 8601 format" })
      .refine((date) => new Date(date) > new Date(), {
        message: "Expiry date must be in the future"
      }),
    isActive: z
      .boolean({ 
        error: "isActive must be true or false" 
      })
      .optional()
      .default(true),
    usageLimit: z
      .number({ 
        error: "Usage limit must be a number" 
      })
      .int({ message: "Usage limit must be an integer" })
      .min(1, { message: "Usage limit must be at least 1" })
      .max(10000, { message: "Usage limit cannot exceed 10,000" })
      .optional(),
    usedCount: z
      .number({ 
        error: "Used count must be a number" 
      })
      .int({ message: "Used count must be an integer" })
      .min(0, { message: "Used count cannot be negative" })
      .optional()
      .default(0),
});

//Only For Admin
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

// Only Admin Can Update Parcel
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