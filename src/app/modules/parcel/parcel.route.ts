import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { ParcelController } from "./parcel.controller";
import { createParcelZodSchema } from "./parcel.validation";


const router = Router();

// --------------Parcel Sender Routes ---------------
// create a parcel
router.post(
  "/",
  checkAuth(Role.SENDER),
  validateRequest(createParcelZodSchema),
  ParcelController.createParcel
);