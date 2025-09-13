import { ParcelStatus, ParcelType, ShippingType } from "./parcel.interface";

export const calculateParcelFee = (
  weight: number,
  type?: string,
  shippingType?: string
): number => {
  let baseFee = 50;

  // Weight-based calculation
  if (weight <= 0.5) {
    baseFee += 50; // Up to 500g
  } else if (weight <= 1) {
    baseFee += 100; // 500g to 1kg
  } else if (weight <= 2) {
    baseFee += 150; // 1kg to 2kg
  } else if (weight <= 5) {
    baseFee += 250; // 2kg to 5kg
  } else if (weight <= 10) {
    baseFee += 400; // 5kg to 10kg
  } else {
    throw new Error("Weight exceeds maximum limit of 10kg");
  }

  // Type-based surcharge
  const typeSurcharge: Record<ParcelType, number> = {
    [ParcelType.FRAGILE]: 25,
    [ParcelType.ELECTRONICS]: 40,
    [ParcelType.DOCUMENT]: 0,
    [ParcelType.PACKAGE]: 10,
  };

  baseFee += type ? typeSurcharge[type as ParcelType] || 0 : 0;

  // Shipping type-based surcharge
  const shippingSurcharge: Record<ShippingType, number> = {
    [ShippingType.STANDARD]: 0,
    [ShippingType.EXPRESS]: 50,
    [ShippingType.SAME_DAY]: 100,
    [ShippingType.OVERNIGHT]: 75,
  };

  baseFee += shippingType
    ? shippingSurcharge[shippingType as ShippingType] || 0
    : 0;

  return Math.round(baseFee);
};

export const expectedDeliveryDate = (shippingType: string): Date => {
  const today = new Date();
  const estimatedDelivery = new Date(today);

  switch (shippingType) {
    case ShippingType.STANDARD:
      estimatedDelivery.setDate(today.getDate() + 5); // 5 days for standard
      break;
    case ShippingType.EXPRESS:
      estimatedDelivery.setDate(today.getDate() + 2); // 2 days for express
      break;
    case ShippingType.SAME_DAY:
      estimatedDelivery.setHours(today.getHours() + 6); // 6 hours for same day
      break;
    case ShippingType.OVERNIGHT:
      estimatedDelivery.setDate(today.getDate() + 1); // 1 day for overnight
      break;
    default:
      throw new Error("Invalid shipping type");
  }

  return estimatedDelivery;
};

// Status transition validation
export const StatusTransitions: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.REQUESTED]: [
    ParcelStatus.APPROVED,
    ParcelStatus.CANCELLED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.APPROVED]: [
    ParcelStatus.PICKED,
    ParcelStatus.CANCELLED,
    ParcelStatus.FLAGGED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.PICKED]: [
    ParcelStatus.DISPATCHED,
    ParcelStatus.RETURNED,
    ParcelStatus.FLAGGED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.DISPATCHED]: [
    ParcelStatus.IN_TRANSIT,
    ParcelStatus.RETURNED,
    ParcelStatus.FLAGGED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.IN_TRANSIT]: [
    ParcelStatus.DELIVERED,
    ParcelStatus.RETURNED,
    ParcelStatus.RESCHEDULED,
    ParcelStatus.FLAGGED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.RESCHEDULED]: [
    ParcelStatus.IN_TRANSIT,
    ParcelStatus.DELIVERED,
    ParcelStatus.CANCELLED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.DELIVERED]: [],
  [ParcelStatus.CANCELLED]: [ParcelStatus.REQUESTED],
  [ParcelStatus.RETURNED]: [ParcelStatus.REQUESTED],
  [ParcelStatus.FLAGGED]: [
    ParcelStatus.BLOCKED,
    ParcelStatus.CANCELLED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.BLOCKED]: [
    ParcelStatus.APPROVED,
    ParcelStatus.CANCELLED,
    ParcelStatus.ON_Hold,
  ],
  [ParcelStatus.ON_Hold]: [
    ParcelStatus.APPROVED,
    ParcelStatus.CANCELLED,
    ParcelStatus.RESCHEDULED,
  ],
};

// Helper function to validate status transitions
export const isValidStatusTransition = (
  currentStatus: ParcelStatus,
  newStatus: ParcelStatus
): boolean => {
  return StatusTransitions[currentStatus].includes(newStatus);
};

// Helper function to get all status values
export const getAllParcelStatuses = (): ParcelStatus[] => {
  return Object.values(ParcelStatus);
};
