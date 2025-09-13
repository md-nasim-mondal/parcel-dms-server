import { z } from "zod";
import { DiscountType } from "./coupon.interface";

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
