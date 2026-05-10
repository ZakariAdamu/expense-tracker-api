import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

export const protect = (req: any, res: any, next: any) => {
	try {
		const token = req.cookies.token; // because we use httpOnly cookie

		if (!token) {
			return res.status(401).json({ message: "You need to login first" });
		}

		const decoded = jwt.verify(token, jwtSecret!) as { id: string };
		req.userId = decoded.id; // This is how we know who the user is
		next(); // Go to the next function (controller)
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
