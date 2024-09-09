import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  chatName: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {_id: false})

const conversationModel = mongoose.model('Conversation', conversationSchema)
export default conversationModel
