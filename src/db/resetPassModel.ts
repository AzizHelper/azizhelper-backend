import mongoose from "mongoose";
const resetPassSchema = new mongoose.Schema({
  token: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, required: true, default: Date.now, expires: '1h' }
}, { collection: 'resetPass' })

const resetPassModel = mongoose.model('resetPass', resetPassSchema);
export default resetPassModel
