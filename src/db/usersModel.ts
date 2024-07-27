import mongoose from "mongoose";
import { hash } from 'bcrypt'
const usersSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { collection: 'users' });

usersSchema.pre('save', async function (next) {
  const hashedPassword = await hash(this.password, 10)
  this.password = hashedPassword
  next()
})

const usersModel = mongoose.model('users', usersSchema);
export default usersModel
