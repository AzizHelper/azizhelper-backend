import mongoose from "mongoose";
import { hash } from "bcrypt";
const usersSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, required: true, default: false },
  },
  { collection: "users" }
);

usersSchema.pre("save", async function (next) {
  const hashedPassword = await hash(this.password, 10);
  this.password = hashedPassword;
  next();
});

usersSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
  const update = this.getUpdate() as { password?: string };
  if (update.password) {
    const hashedPassword = await hash(update.password, 10);
    update.password = hashedPassword;
  }
  next();
});

const usersModel = mongoose.model("users", usersSchema);
export default usersModel;
