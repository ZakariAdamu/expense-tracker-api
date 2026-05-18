import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
	ACCESS_TOKEN_COOKIE,
	LEGACY_TOKEN_COOKIE,
	REFRESH_TOKEN_COOKIE,
	createAccessToken,
	extractBearerToken,
	extractCookieToken,
	getAccessTokenCookieOptions,
	verifyToken,
} from "../lib/jwt.js";

function getAccessToken(req: Request) {
	return (
		extractBearerToken(req.headers.authorization) ??
		extractCookieToken(req.cookies, ACCESS_TOKEN_COOKIE) ??
		extractCookieToken(req.cookies, LEGACY_TOKEN_COOKIE)
	);
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
	const accessToken = getAccessToken(req);

	if (accessToken) {
		try {
			const payload = verifyToken(accessToken, "access");
			req.userId = payload.sub;
			req.accessTokenPayload = payload;
			return next();
		} catch (error) {
			if (!(error instanceof jwt.TokenExpiredError)) {
				return res.status(401).json({
					status: "error",
					message: "Invalid authentication token",
				});
			}
		}
	}

	const refreshToken =
		extractCookieToken(req.cookies, REFRESH_TOKEN_COOKIE) ??
		extractBearerToken(req.headers["x-refresh-token"] as string | undefined);

	if (!refreshToken) {
		return res.status(401).json({
			status: "error",
			message: "You need to login first",
		});
	}

	try {
		const refreshPayload = verifyToken(refreshToken, "refresh");
		const newAccessToken = createAccessToken(refreshPayload.sub);
		req.userId = refreshPayload.sub;
		req.accessTokenPayload = verifyToken(newAccessToken, "access");
		res.cookie(
			ACCESS_TOKEN_COOKIE,
			newAccessToken,
			getAccessTokenCookieOptions(),
		);
		res.cookie(
			LEGACY_TOKEN_COOKIE,
			newAccessToken,
			getAccessTokenCookieOptions(),
		);
		return next();
	} catch {
		return res.status(401).json({
			status: "error",
			message: "Invalid or expired token",
		});
	}
};
