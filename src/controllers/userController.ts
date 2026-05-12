import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as z from "zod";
import User from "../models/userModel.ts";

const jwtSecret = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = "24h";

const createToken = (userId: unknown) => {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: TOKEN_EXPIRATION });
};

// Validation schemas
const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
  })
  .refine(
    (data) => {
      if (data.password) {
        return data.password.length >= 8;
      }
      return true; // If password is not provided, it's valid
    },
    {
      message: "Password must be at least 8 characters",
    },
  );
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// ====================== SIGNUP or SIGNUP ======================
export async function signupUser(req: Request, res: Response) {
  try {
    const validated = signupSchema.parse(req.body);

    if (await User.findOne({ email: validated.email })) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    const user = new User({
      name: validated.name,
      email: validated.email,
      password: hashedPassword,
    });

    await user.save();

    const token = createToken(user._id.toString());

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: "success",
      user: { id: user._id, name: user.name, email: user.email },
      message: "User signed up successfully 🚀",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: error.message });
    }
    res.status(500).json({ message: "Server error" });
  }
}

// ====================== LOGIN ======================
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "User doesn't exist or password is incorrect" });
    }

    const token = createToken(user._id.toString());

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      status: "success",
      user: { id: user._id, name: user.name, email: user.email },
      message: "Logged in successfully 🚀",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input" });
    }
    const message = error instanceof Error ? error.message : "Server error";
    res.status(500).json({ message });
  }
}

// ====================== PROTECTED ROUTES ======================
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findById(req.userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ status: "success", user });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function logoutUser(req: Request, res: Response) {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.json({ status: "success", message: "Logged out successfully" });
}

// UPDATE PROFILE (name, email, password)
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, email, password } = updateProfileSchema.parse(req.body);
    if (!name && !email && !password) {
      return res.status(400).json({
        message:
          "At least one field (name, email, or password) must be provided for update",
      });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If email is being updated, check if it's already in use by another user
    if (email && email !== existingUser.email) {
      const emailInUse = await User.findOne({ email });
      if (emailInUse) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }
    const updateData: Partial<{
      name: string;
      email: string;
      password: string;
    }> = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      const SALT_ROUNDS = 12; // Use 12+ in 2026
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("name email");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      status: "success",
      user: updatedUser,
      message: "User updated successfully",
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

// to change password
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body,
    );

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message:
          "Current and new passwords are required and must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const SALT_ROUNDS = 12; // Use 12+ in 2026
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}
