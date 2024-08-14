import { Router, Request, Response } from "express";

import passport from "passport";

import conversationModel from "../db/conversationModel";

import chat from "../utils/openai";

import { validateData } from "../middleware/validationMiddleware";
import { getChatSchema, sendMessageSchema } from "../schemas/chatSchema";

const chatRouter: Router = Router();

chatRouter.post(
  "/sendMessage",
  passport.authenticate("jwt", { session: false }),
  validateData(sendMessageSchema),
  async (req: Request["body"], res: Response) => {
    try {
      // Extract info
      const userId = req.user._id;
      const { chatId, userMessage } = req.body;

      // Create a new conversation if it doesn't exist and save the user message
      let conversation = await conversationModel.findOne({ userId, chatId });
      if (!conversation) {
        const genChatName = await chat.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Generate a suitable name for this chat based on the context.",
            },
            { role: "user", content: userMessage },
          ],
        });
        const chatName = genChatName.choices[0].message.content;
        conversation = new conversationModel({
          userId,
          chatId,
          chatName,
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that only responds to messages related to King Abdulaziz University (KAU).",
            },
          ],
        });
      }
      conversation.messages.push({ role: "user", content: userMessage });
      await conversation.save();

      // Generate assistant message based on user message + pervious messages
      const response = await chat.create({
        model: "gpt-4o-mini",
        messages: conversation.messages,
      });

      // Save the assistant message in db
      const assistantMessage = response.choices[0].message.content;
      conversation.messages.push({
        role: "assistant",
        content: assistantMessage,
      });
      await conversation.save();

      return res.json({ assistantMessage });
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  }
);

chatRouter.get(
  "/getChats",
  passport.authenticate("jwt", { session: false }),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id;
      const conversations = await conversationModel.find(
        { userId },
        { chatId: 1, chatName: 1 } // Return chatId and chatName only
      );
      if (!conversations) {
        return res.status(404).json({ message: "No conversations found." });
      }
      return res.json(conversations);
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  }
);

chatRouter.post(
  "/getChat",
  passport.authenticate("jwt", { session: false }),
  validateData(getChatSchema),
  async (req: Request["body"], res: Response) => {
    try {
      const { chatId } = req.body;
      const userId = req.user._id;
      const conversations = await conversationModel.findOne({
        userId: userId,
        chatId: chatId,
      });
      if (!conversations) {
        return res.status(404).json({ message: "Conversation not found." });
      }
      return res.json(conversations.messages);
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  }
);

export default chatRouter;
