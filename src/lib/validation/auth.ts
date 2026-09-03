import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name cannot be blank").max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});
