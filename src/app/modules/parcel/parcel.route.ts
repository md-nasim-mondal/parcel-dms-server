import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { ParcelController } from "./parcel.controller";
import {
  createParcelByAdminZodSchema,
  createParcelZodSchema,
  updateBlockedStatusSchema,
  updateStatusPersonnelSchema,
} from "./parcel.validation";

const router = Router();

// --------------Parcel Sender Routes ---------------
// create a parcel by sender
router.post(
  "/",
  checkAuth(Role.SENDER),
  validateRequest(createParcelZodSchema),
  ParcelController.createParcel
);

// Cancel a parcel by sender
router.post(
  "/cancel/:id",
  checkAuth(Role.SENDER),
  ParcelController.cancelParcel
);

// Get all sender's parcels
router.get("/me", checkAuth(Role.SENDER), ParcelController.getSenderParcels);

// delete a parcel
router.delete(
  "/delete/:id",
  checkAuth(Role.SENDER),
  ParcelController.deleteParcel
);

// Get a specific parcel by ID
router.get(
  "/:id/status-log",
  checkAuth(Role.SENDER),
  ParcelController.getParcelWithHistory
);

// <----------------PARCEL RECEIVER ROUTES ---------------->

// Get receiver's incoming parcels
router.get(
  "/me/incoming",
  checkAuth(Role.RECEIVER),
  ParcelController.getIncomingParcels
);

// Get delivery history
router.get(
  "/me/history",
  checkAuth(Role.RECEIVER),
  ParcelController.getDeliveryHistory
);

// Confirm delivery of a specific parcel by ID
router.patch(
  "/confirm/:id",
  checkAuth(Role.RECEIVER),
  ParcelController.confirmDelivery
);

// <----------------PARCEL ADMIN ROUTES ---------------->

// Get all parcels
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.getAllParcels
);

// Create a parcel by admin if needed
router.post(
  "/create-parcel",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createParcelByAdminZodSchema),
  ParcelController.createParcelByAdmin
);

// Update a parcel delivery status and assign delivery personnel if needed
router.patch(
  "/:id/delivery-status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateStatusPersonnelSchema),
  ParcelController.updateParcelStatus
);

// Update a parcel's blocked status
router.patch(
  "/:id/block-status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateBlockedStatusSchema),
  ParcelController.blockStatusParcel
);

// Get a specific parcel by ID with full details
router.get(
  "/:id/details",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.getParcelById
);

// <----------------PARCEL PUBLIC ROUTES ---------------->
// Track a parcel by tracking ID with limited information
router.get("/tracking/:trackingId", ParcelController.getParcelByTrackingId);

export const ParcelRoutes = router;
