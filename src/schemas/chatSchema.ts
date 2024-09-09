import { z } from 'zod';

export const createChatSchema = z.object({
  initialMessage: z.string(),
})

export const sendMessageSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/),
  userMessage: z.string()
})

export const getChatSchema = z.object({
  chatId: z.string().regex(/^[0-9a-f]{24}$/),
})