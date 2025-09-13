export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface ICoupon {
  code?: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt: Date;
  isActive?: boolean;
  usageLimit?: number;
  usedCount?: number;
}