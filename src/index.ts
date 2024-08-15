import mongoose from "mongoose";

import express from "express";
import cors from "cors";

import "dotenv/config";

import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import profileRouter from "./routes/profile";

import passport from "passport";
import jwtAuth from "./jwtAuth";

const port = 4000;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/profile", profileRouter);

async function main() {
  passport.use(jwtAuth);
  const mongoConnString = process.env.MONGO_CONN || "";
  await mongoose.connect(mongoConnString);
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

main();
