import { Router, Request, Response } from "express";

import passport from "passport";

import conversationModel from "../db/conversationModel";

import chat from "../utils/openai";

import { validateData } from "../middleware/validationMiddleware";
import {
  createChatSchema,
  getChatSchema,
  sendMessageSchema,
} from "../schemas/chatSchema";

const chatRouter: Router = Router();

chatRouter.post(
  "/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  validateData(sendMessageSchema),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id;
      const { userMessage } = req.body;
      const { chatId } = req.params;

      const conversation = await conversationModel.findOne({
        _id: chatId,
        userId,
      });
      if (!conversation) {
        return res.status(404).json({ message: "Chat not found." });
      }

      conversation.messages.push({ role: "user", content: userMessage });
      await conversation.save();

      const response = await chat.create({
        model: "gpt-4o-mini",
        messages: conversation.messages,
      });

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
  "/:chatId/messages",
  passport.authenticate("jwt", { session: false }),
  validateData(getChatSchema),
  async (req: Request["body"], res: Response) => {
    try {
      const { chatId } = req.params;
      const userId = req.user._id;
      const conversations = await conversationModel.findOne({
        _id: chatId,
        userId,
      });
      if (!conversations) {
        return res.status(404).json({ message: "Conversation not found." });
      }
      // Filter out messages with role: 'system'
      const filteredMessages = conversations.messages.filter(
        (message) => message.role !== "system"
      );
      return res.json(filteredMessages);
    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  }
);

chatRouter.get(
  "/",
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
  "/",
  passport.authenticate("jwt", { session: false }),
  validateData(createChatSchema),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id;
      const { initialMessage } = req.body;

      const genChatName = await chat.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Generate a suitable name for this chat based on the context.",
          },
          { role: "user", content: initialMessage },
        ],
      });
      const chatName = genChatName.choices[0].message.content;

      const conversation = await conversationModel.create({
        userId,
        chatName,
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that only responds to messages related to King Abdulaziz University (KAU)",
          },
          { role: "user", content: initialMessage },
        ],
      });

      const response = await chat.create({
        model: "gpt-4o-mini",
        messages: conversation.messages,
      });

      conversation.messages.push({
        role: "assistant",
        content: response.choices[0].message.content,
      });
      await conversation.save();

      res.status(201).json({
        message: "Chat created successfully",
        chatId: conversation._id,
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default chatRouter;
