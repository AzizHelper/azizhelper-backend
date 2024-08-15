import { z } from "zod";

export const updateUserInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
})
