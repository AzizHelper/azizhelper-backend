import { Router, Request, Response } from 'express';

import passport from 'passport';

import conversationModel from '../db/ConversationModel';

import chat from '../utils/openai';

import { validateData } from '../middleware/validationMiddleware';
import { sendMessageSchema } from '../schemas/chatSchema';

const chatRouter: Router = Router();

chatRouter.post("/sendMessage", passport.authenticate('jwt', { session: false }),
  validateData(sendMessageSchema), async (req: Request["body"], res: Response) => {
    try {

      // Extract info
      const userId = req.user._id
      const { chatId, userMessage } = req.body

      // Create a new conversation if it doesn't exist and save the user message
      let conversation = await conversationModel.findOne({ userId, chatId })
      if (!conversation) {
        const genChatName = await chat.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Generate a suitable name for this chat based on the context.' },
            { role: 'user', content: userMessage }
          ]
        })
        const chatName = genChatName.choices[0].message.content
        conversation = new conversationModel({ userId, chatId, chatName, messages: [] })
      }
      conversation.messages.push({ role: 'user', content: userMessage });
      await conversation.save()

      // Generate assistant message based on user message + pervious messages
      const response = await chat.create({
        model: 'gpt-4o-mini',
        messages: conversation.messages
      })

      // Save the assistant message in db
      const assistantMessage = response.choices[0].message.content
      conversation.messages.push({ role: 'assistant', content: assistantMessage });
      await conversation.save()

      return res.json({ assistantMessage });

    } catch (err) {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

export default chatRouter