import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createAdminZodSchema, createDeliveryPersonnelZodSchema, updateUserBlockedStatusSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers
);
router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe);

router.post(
  "/create-admin",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createAdminZodSchema),
  UserControllers.createAdmin
);
router.post(
  "/create-delivery-personnel",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createDeliveryPersonnelZodSchema),
  UserControllers.createDeliveryPersonnel
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getSingleUser
);
router.put(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(Role)),
  UserControllers.updateUser
);
router.patch(
  "/block-user/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateUserBlockedStatusSchema),
  UserControllers.blockStatusUser
);
export const UserRoutes = router;
