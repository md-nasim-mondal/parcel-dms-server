import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { ParcelRoutes } from "../modules/parcel/parcel.route";
import { CouponRoutes } from "../modules/coupon/coupon.route";
import { StatsRoutes } from "../modules/stats/stats.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
  {
    path: "/parcels",
    route: ParcelRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/stats",
    route: StatsRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
