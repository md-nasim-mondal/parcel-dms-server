import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsController } from "./stats.controller";

const router = express.Router();

// system stats route for admin
router.get(
  "/parcel",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getParcelsStats
);
router.get(
  "/user",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  StatsController.getUserStats
);

// receiver stats route for receiver
router.get(
  "/receiver",
  checkAuth(Role.RECEIVER),
  StatsController.getReceiverStats
);

// sender stats route for sender
router.get("/sender", checkAuth(Role.SENDER), StatsController.getSenderStats);

export const StatsRoutes = router;
