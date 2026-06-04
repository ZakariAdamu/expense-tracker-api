import express from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  refreshAuthTokens,
  verifyEmail,
  resendVerificationCode,
} from "../controllers/userController.ts";
import { protect } from "../middleware/auth.ts";

const userRouter = express.Router();

userRouter.post("/signup", signupUser);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-verification-code", resendVerificationCode);
userRouter.post("/login", loginUser);
userRouter.post("/refresh", refreshAuthTokens);
userRouter.post("/logout", logoutUser);

// Protected routes (need login to access)
userRouter.get("/me", protect, getCurrentUser);
userRouter.put("/update-profile", protect, updateProfile);
userRouter.put("/change-password", protect, changePassword);

export default userRouter;
