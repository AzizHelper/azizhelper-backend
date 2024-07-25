import { Router, Request, Response } from 'express';

import { compare } from 'bcrypt';

import jwt from 'jsonwebtoken';
import passport from 'passport';

import usersModel from '../db/usersModel';

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
    return res.status(500).json({ message: 'Internal Server Error.' })
  }
})

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const {email, password } = req.body
    if (!email || !password) {
      return res.status(422).json({ message: "Invalid request." })
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
    return res.status(500).json({ message: 'Internal Server Error.' })
  }
})

authRouter.get("/authenticated", passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response) => {
    try {
      return res.status(200).json({ message: "Authenticated." })
    } catch {
      return res.status(500).json({ message: 'Internal Server Error.' })
    }
  })
  
export default authRouter
