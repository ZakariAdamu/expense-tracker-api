import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token; // because we use httpOnly cookie

    if (!token) {
      return res.status(401).json({ message: "You need to login first" });
    }

    if (!jwtSecret) {
      return res
        .status(500)
        .json({ message: "Internal server error: JWT secret missing" });
    }
    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    req.userId = decoded.id; // This is how we know who the user is
    next(); // Go to the next function (controller)
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
