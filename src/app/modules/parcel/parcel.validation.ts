import { z } from "zod";
import { ParcelType, ShippingType } from "./parcel.interface";

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
