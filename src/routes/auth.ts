import { Router, Request, Response } from 'express';

import { compare } from 'bcrypt';

import jwt from 'jsonwebtoken';
import passport from 'passport';

import usersModel from '../db/usersModel';
import resetPassModel from '../db/resetPassModel';

import crypto from 'crypto';
import mail from '../utils/mail';

import { validateData } from '../middleware/validationMiddleware';
import { userLoginSchema, userRegistrationSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '../schemas/authSchema';

const authRouter: Router = Router();

authRouter.post("/register", validateData(userRegistrationSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body
      const userExists = await usersModel.exists({ email: email })
      if (userExists) {
        return res.status(409).json({ message: "A User with this email already exists." });
      }
      const user = await usersModel.create({
        name: name,
        email: email,
        password: password,
      });
      mail.sendMail({
        from: process.env.MAIL_SENDER,
        to: email,
        subject: 'AzizHelper - Verify Email',
        text: `Click on the link to verify your email: ${process.env.CLIENT_URL}/verify-email/${user._id}`
      })
      return res.status(201).json({ message: "User created." });
    } catch {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

authRouter.post("/login", validateData(userLoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body
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

authRouter.post("/forgot-password", validateData(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body
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

authRouter.post("/reset-password", validateData(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body
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

authRouter.post("/resend-verification-email", passport.authenticate("jwt"),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id
      const user = await usersModel.findOne({ _id: userId })
      if (!user) {
        return res.status(404).json({ message: "User not found." })
      }
      if (user.isVerified) {
        return res.status(409).json({ message: "Email already verified." })
      }
      mail.sendMail({
        from: process.env.MAIL_SENDER,
        to: user.email,
        subject: 'AzizHelper - Verify Email',
        text: `Click on the link to verify your email: ${process.env.CLIENT_URL}/verify-email/${userId}`
      })
      return res.status(200).json({ message: "Verification email sent." })
    } catch {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

authRouter.get("/verify-email/:id", validateData(verifyEmailSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const user = await usersModel.findOne({ _id: id })
      if (!user) {
        return res.status(404).json({ message: "User not found." })
      }
      if (user.isVerified) {
        return res.status(409).json({ message: "Email already verified." })
      }
      await usersModel.updateOne({ _id: id }, { isVerified: true })
      return res.status(200).json({ message: "Email verified." })
    } catch {
      return res.status(500).json({ message: "Internal Server Error." })
    }
  })

export default authRouter
