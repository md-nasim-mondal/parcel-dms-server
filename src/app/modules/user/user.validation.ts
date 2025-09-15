import { z } from "zod";
import { IsActive, Role } from "./user.interface";

// ----------------- Create User Schema -----------------
export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .refine((val) => typeof val === "string", {
      message: "Name must be string",
    }),

  email: z
    .string()
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." })
    .email({ message: "Invalid email address format." })
    .refine((val) => typeof val === "string", {
      message: "Email must be string",
    }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/^(?=.*[A-Z])/, {
      message: "Password must contain at least 1 uppercase letter.",
    })
    .regex(/^(?=.*[!@#$%^&*])/, {
      message: "Password must contain at least 1 special character.",
    })
    .regex(/^(?=.*\d)/, {
      message: "Password must contain at least 1 number.",
    })
    .refine((val) => typeof val === "string", {
      message: "Password must be string",
    }),

  phone: z
    .string()
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),

  defaultAddress: z
    .string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional()
    .refine((val) => !val || typeof val === "string", {
      message: "Address must be string",
    }),
  role: z
    .enum([Role.SENDER, Role.RECEIVER] as [string, ...string[]])
    .optional()
    .refine((val) => val === undefined || val === Role.SENDER || val === Role.RECEIVER, {
      message: "Role must be either 'SENDER' or 'RECEIVER'",
    }),
});

// ----------------- Update User Schema -----------------
export const updateUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .optional()
    .refine((val) => !val || typeof val === "string", {
      message: "Name must be string",
    }),

  phone: z
    .string()
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),

  role: z.enum(Object.values(Role) as [string]).optional(),

  isActive: z.enum(Object.values(IsActive) as [string]).optional(),

  isDeleted: z
    .boolean()
    .optional()
    .refine((val) => typeof val === "boolean", {
      message: "isDeleted must be true or false",
    }),

  isVerified: z
    .boolean()
    .optional()
    .refine((val) => typeof val === "boolean", {
      message: "isVerified must be true or false",
    }),

  defaultAddress: z
    .string()
    .max(200, { message: "Address cannot exceed 200 characters." })
    .optional()
    .refine((val) => !val || typeof val === "string", {
      message: "Address must be string",
    }),
});
