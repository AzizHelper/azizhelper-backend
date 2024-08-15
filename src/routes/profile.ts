import { Router, Request, Response } from "express";

import { validateData } from "../middleware/validationMiddleware";
import { updateUserInfoSchema } from "../schemas/profileSchema";

import passport from "passport";

import usersModel from "../db/usersModel";

const profileRouter: Router = Router();

profileRouter.post(
  "/updateUserInfo",
  validateData(updateUserInfoSchema),
  passport.authenticate("jwt", { session: false }),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id;
      const { email } = req.body;

      if (email) {
        const emailUsed = await usersModel.findOne({ email });
        if (emailUsed) {
          return res.status(409).json({ message: "Email already in use." });
        }
        req.body.isVerified = false;
      }

      const updatedUser = await usersModel.findByIdAndUpdate(
        userId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

profileRouter.get(
  "/getUserInfo",
  passport.authenticate("jwt", { session: false }),
  async (req: Request["body"], res: Response) => {
    try {
      const userId = req.user._id;
      const user = await usersModel.findById(userId, { password: 0 });
      return res.json(user);
    } catch {
      return res.status(500).json({ message: "Internal Server Error." });
    }
  }
);

export default profileRouter;
