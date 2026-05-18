import "express-serve-static-core";
import type { AuthTokenPayload } from "../lib/jwt.js";

declare module "express-serve-static-core" {
	interface Request {
		userId?: string;
		accessTokenPayload?: AuthTokenPayload;
	}
}

export {};
