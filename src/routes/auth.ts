import { Router, Request, Response } from 'express';

import { compare } from 'bcrypt';

import jwt from 'jsonwebtoken';
import passport from 'passport';

import usersModel from '../db/usersModel';
import resetPassModel from '../db/resetPassModel';

import crypto from 'crypto';
import mail from '../utils/mail';

const authRouter: Router = Router();

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(422).json({ message: "Invalid request." })
    }
    const validEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(email)
    if (!validEmail) {
      return res.status(422).json({ message: "Invalid email." })
    }
    const validPassword = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,16}$/.test(password)
    if (!validPassword) {
      return res.status(422).json({ message: "Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter and one number." })
    }
    const userExists = await usersModel.exists({ email: email })
    if (userExists) {
      return res.status(409).json({ message: "A User with this email already exists." });
    }
    await usersModel.create({
      name: name,
      email: email,
      password: password,
    });
    return res.status(201).json({ message: "User created." });
  } catch {
    return res.status(500).json({ message: "Internal Server Error." })
  }
})

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(422).json({ message: "Invalid request." })
    }
    const validEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/.test(email)
    if (!validEmail) {
      return res.status(422).json({ message: "Invalid email." })
    }
    const user = await usersModel.findOne({ email: email })
    if (!user) {
      return res.status(404).json({ message: "User doesn't exists." });
    }
    compare(password, user.password, (err, correctPassword) => {
      if (!correctPassword) {
        return res.status(401).json({ message: "Invalid credentials." })
      }
      const token = jwt.sign({ id: user._id },
        process.env.JWT_SECRET || '',
        { expiresIn: "1h" });
      return res.cookie('token', token, { httpOnly: true, secure: true, signed: true, maxAge: 3600000 }).
        json({ message: "Logged in successfully." })
    })
  } catch {
    return res.status(500).json({ message: "Internal Server Error." })
  }
})

authRouter.post("/logout", passport.authenticate("jwt", { session: false }),
  (req: Request, res: Response) => {
    try {
      return res.clearCookie('token').json({ message: "Logged out successfully." })
    } catch {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

authRouter.get("/authenticated", passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      return res.status(200).json({ message: "Authenticated." })
    } catch {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(422).json({ message: "Invalid request." })
    }
    const user = await usersModel.exists({ email: email })
    if (!user) {
      return res.status(404).json({ message: "No user associated with this email address." })
    }
    const resetTokenExists = await resetPassModel.exists({ email: email })
    if (resetTokenExists) {
      return res.status(409).json({ message: "A reset password request has already been made, try again after a while." })
    }
    const token = crypto.randomBytes(20).toString('hex')
    await resetPassModel.create({
      token: token,
      email: email
    })
    mail.sendMail({
      from: process.env.MAIL_SENDER,
      to: email,
      subject: 'AzizHelper - Reset Password',
      text: `Click on the link to reset your password: ${process.env.CLIENT_URL}/reset-password/?t=${token}`
    })
    return res.status(200).json({ message: "Reset password link sent to the email address." })
  } catch {
    return res.status(500).json({ message: "Internal Server Error." })
  }
})

authRouter.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(422).json({ message: "Invalid request." })
    }
    const validPassword = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?!.* ).{8,16}$/.test(password)
    if (!validPassword) {
      return res.status(422).json({ message: "Password must be 8-16 characters long, contain at least one uppercase letter, one lowercase letter and one number." })
    }
    const resetToken = await resetPassModel.findOne({ token: token })
    if (!resetToken) {
      return res.status(404).json({ message: "Invalid token." })
    }
    await usersModel.updateOne({ email: resetToken.email }, { password: password })
    await resetPassModel.deleteOne({ token: token })
    return res.status(200).json({ message: "Password reset successfully." })
  } catch {
    return res.status(500).json({ message: "Internal Server Error." })
  }
})


export default authRouter
