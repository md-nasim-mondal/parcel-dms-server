import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { CouponController } from "./coupon.controller";
import { createCouponZodSchema } from "./coupon.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createCouponZodSchema),
  CouponController.createCoupon
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  CouponController.getAllCoupons
);

export const CouponRoutes = router;
