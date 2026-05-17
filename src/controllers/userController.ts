import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import * as z from "zod";
import {
	createAccessToken,
	createRefreshToken,
	extractCookieToken,
	clearAuthCookies,
	setAuthCookies,
	verifyToken,
} from "../lib/jwt.js";
import { sendError, sendSuccess } from "../lib/response.js";
import User from "../models/userModel.ts";

// ====================== SCHEMAS ======================
export const signupSchema = z
	.object({
		name: z.string().trim().min(1, "Name is required"),
		email: z.string().trim().email("Email is not valid"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(8, "Confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const loginSchema = z.object({
	email: z.string().trim().email("Invalid email"),
	password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z
	.object({
		name: z.string().trim().min(1).optional(),
		email: z.string().trim().email().optional(),
		password: z.string().min(8).optional(),
	})
	.refine((data) => Boolean(data.name || data.email || data.password), {
		message: "At least one field must be provided",
	});

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Helper to map Zod validation errors to a field-based error object
function mapZodIssues(error: z.ZodError) {
	return error.issues.reduce<Record<string, string>>((accumulator, issue) => {
		accumulator[issue.path.join(".") || "form"] = issue.message;
		return accumulator;
	}, {});
}

// Helper to generate tokens and set cookies
function authCookieResponse(userId: string) {
	const accessToken = createAccessToken(userId);
	const refreshToken = createRefreshToken(userId);
	return { accessToken, refreshToken };
}

// ====================== SIGNUP ======================
export async function signupUser(req: Request, res: Response) {
	try {
		const validated = signupSchema.parse(req.body);
		const existingUser = await User.findOne({ email: validated.email });

		if (existingUser) {
			return sendError(res, 409, "Email already in use");
		}

		const hashedPassword = await bcrypt.hash(validated.password, 12);
		const user = await User.create({
			name: validated.name,
			email: validated.email,
			password: hashedPassword,
		});

		const tokens = authCookieResponse(user._id.toString());
		setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

		return sendSuccess(res, 201, "User signed up successfully", {
			user: { id: user._id.toString(), name: user.name, email: user.email },
			accessToken: tokens.accessToken,
		});
	} catch (error: unknown) {
		if (error instanceof z.ZodError) {
			return sendError(res, 422, "Validation failed", {
				fields: mapZodIssues(error),
			});
		}

		return sendError(
			res,
			500,
			error instanceof Error ? error.message : "Server error",
		);
	}
}

// ====================== LOGIN ======================
export async function loginUser(req: Request, res: Response) {
	try {
		const { email, password } = loginSchema.parse(req.body);
		const user = await User.findOne({ email }).select("+password");

		if (!user || !user.password) {
			return sendError(res, 401, "Invalid email or password");
		}

		const passwordMatches = await bcrypt.compare(password, user.password);
		if (!passwordMatches) {
			return sendError(res, 401, "Invalid email or password");
		}

		const tokens = authCookieResponse(user._id.toString());
		setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

		return sendSuccess(res, 200, "Logged in successfully", {
			user: { id: user._id.toString(), name: user.name, email: user.email },
			accessToken: tokens.accessToken,
		});
	} catch (error: unknown) {
		if (error instanceof z.ZodError) {
			return sendError(res, 422, "Validation failed", {
				fields: mapZodIssues(error),
			});
		}

		return sendError(
			res,
			500,
			error instanceof Error ? error.message : "Server error",
		);
	}
}

// ====================== REFRESH ======================
export async function refreshAuthTokens(req: Request, res: Response) {
	try {
		const refreshToken = extractCookieToken(req.cookies, "refreshToken");

		if (!refreshToken) {
			return sendError(res, 401, "Refresh token is required");
		}
		const payload = verifyToken(refreshToken, "refresh");
		const tokens = authCookieResponse(payload.sub);
		setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

		return sendSuccess(res, 200, "Session refreshed", {
			accessToken: tokens.accessToken,
		});
	} catch (error: unknown) {
		return sendError(
			res,
			401,
			error instanceof Error ? error.message : "Invalid refresh token",
		);
	}
}

// ====================== PROTECTED ROUTES ======================
export async function getCurrentUser(req: Request, res: Response) {
	try {
		if (!req.userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const user = await User.findById(req.userId).select("name email");
		if (!user) {
			return sendError(res, 404, "User not found");
		}

		return sendSuccess(res, 200, "User retrieved successfully", {
			user: { id: user._id.toString(), name: user.name, email: user.email },
		});
	} catch (error: unknown) {
		return sendError(
			res,
			500,
			error instanceof Error ? error.message : "Server error",
		);
	}
}

export async function logoutUser(_req: Request, res: Response) {
	clearAuthCookies(res);
	return sendSuccess(res, 200, "Logged out successfully", null);
}

// UPDATE PROFILE (name, email, password)
export async function updateProfile(req: Request, res: Response) {
	try {
		if (!req.userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const { name, email, password } = updateProfileSchema.parse(req.body);
		const existingUser = await User.findById(req.userId).select("+password");

		if (!existingUser) {
			return sendError(res, 404, "User not found");
		}

		if (email && email !== existingUser.email) {
			const emailInUse = await User.findOne({ email });
			if (emailInUse) {
				return sendError(res, 409, "Email is already in use");
			}
		}

		if (name) {
			existingUser.name = name;
		}

		if (email) {
			existingUser.email = email;
		}

		let issuedTokens: ReturnType<typeof authCookieResponse> | null = null;

		if (password) {
			existingUser.password = await bcrypt.hash(password, 12);
			existingUser.markModified("password");
			issuedTokens = authCookieResponse(existingUser._id.toString());
			setAuthCookies(res, issuedTokens.accessToken, issuedTokens.refreshToken);
		}

		await existingUser.save();

		return sendSuccess(res, 200, "Profile updated successfully", {
			user: {
				id: existingUser._id.toString(),
				name: existingUser.name,
				email: existingUser.email,
			},
			...(issuedTokens ? { accessToken: issuedTokens.accessToken } : {}),
		});
	} catch (error: unknown) {
		if (error instanceof z.ZodError) {
			return sendError(res, 422, "Validation failed", {
				fields: mapZodIssues(error),
			});
		}

		return sendError(
			res,
			500,
			error instanceof Error ? error.message : "Server error",
		);
	}
}

// to change password
export async function changePassword(req: Request, res: Response) {
	try {
		if (!req.userId) {
			return sendError(res, 401, "Unauthorized");
		}

		const { currentPassword, newPassword } = changePasswordSchema.parse(
			req.body,
		);

		const user = await User.findById(req.userId).select("+password");
		if (!user || !user.password) {
			return sendError(res, 404, "User not found");
		}

		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password,
		);
		if (!isCurrentPasswordValid) {
			return sendError(res, 400, "Current password is incorrect");
		}

		user.password = await bcrypt.hash(newPassword, 12);
		user.markModified("password");
		await user.save();

		const tokens = authCookieResponse(user._id.toString());
		setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

		return sendSuccess(res, 200, "Password changed successfully", {
			accessToken: tokens.accessToken,
		});
	} catch (error: unknown) {
		if (error instanceof z.ZodError) {
			return sendError(res, 422, "Validation failed", {
				fields: mapZodIssues(error),
			});
		}

		return sendError(
			res,
			500,
			error instanceof Error ? error.message : "Server error",
		);
	}
}
