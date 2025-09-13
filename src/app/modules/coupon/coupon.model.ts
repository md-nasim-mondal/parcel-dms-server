import { model, Schema } from "mongoose";
import { DiscountType, ICoupon } from "./coupon.interface";

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      default: DiscountType.PERCENTAGE,
      required: true,
    },
    discountValue: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number, min: 0, default: 50 },
    usedCount: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Coupon = model<ICoupon>("Coupon", couponSchema);
