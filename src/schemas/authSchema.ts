import { z } from "zod";

export const userRegistrationSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,16}$/),
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,16}$/),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{40}$/),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,16}$/),
});

export const verifyEmailSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{24}$/),
});
