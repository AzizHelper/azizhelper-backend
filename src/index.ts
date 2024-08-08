import mongoose from 'mongoose';

import express from 'express';
import cors from 'cors';

import 'dotenv/config'

import authRouter from './routes/auth';
import chatRouter from './routes/chat';

import passport from 'passport';
import jwtAuth from './jwtAuth';

import cookieParser from 'cookie-parser';

const port  = 4000
const app = express()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize())
app.use(cookieParser(process.env.JWT_SECRET || ''))

app.use('/auth', authRouter)
app.use('/chat', chatRouter)

async function main() {
  passport.use(jwtAuth)
  const mongoConnString = process.env.MONGO_CONN || ''
  await mongoose.connect(mongoConnString)
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
  })
}

main()