import { z } from "zod";

export const otpSendZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .refine((val) => typeof val === "string", {
      message: "Name must be string",
    })
    .optional(),

  email: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Invalid email address format." })
    .refine((val) => typeof val === "string", {
      message: "Email must be string",
    }),
});

export const otpVerifyZodSchema = z.object({
  email: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Invalid email address format." })
    .refine((val) => typeof val === "string", {
      message: "Email must be string",
    }),

  otp: z
    .string()
    .length(6, { message: "OTP must be exactly 6 characters long." })
    .regex(/^\d+$/, { message: "OTP must contain only digits." })
    .refine((val) => typeof val === "string", {
      message: "OTP must be string",
    }),
});
