import express from "express";
import {
	registerUser,
	loginUser,
	logoutUser,
	getCurrentUser,
	updateProfile,
	changePassword,
} from "../controllers/userController";
import { protect } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);

// Protected routes (need login to access)
userRouter.get("/me", protect, getCurrentUser);
userRouter.put("/update-profile", protect, updateProfile);
userRouter.put("/change-password", protect, changePassword);

export default userRouter;
