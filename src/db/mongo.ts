import mongoose from "mongoose";
import { env, hasMongoDbUri } from "../config/env";

type MongoStatus = {
	configured: boolean;
	validUri: boolean;
	connected: boolean;
	message: string;
};

let status: MongoStatus = {
	configured: hasMongoDbUri,
	validUri: isValidMongoUri(env.mongoDbUri),
	connected: false,
	message: hasMongoDbUri ? "MongoDB URI configured" : "MONGODBURI is not set",
};

function isValidMongoUri(uri: string) {
	return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
}

export function getMongoStatus() {
	return status;
}

export async function initializeMongoConnection() {
	if (!hasMongoDbUri) {
		status = {
			configured: false,
			validUri: false,
			connected: false,
			message: "MONGODBURI is not set",
		};
		return status;
	}

	if (!isValidMongoUri(env.mongoDbUri)) {
		status = {
			configured: true,
			validUri: false,
			connected: false,
			message:
				"MONGODBURI is invalid. Use mongodb:// or mongodb+srv:// URI format.",
		};
		return status;
	}

	try {
		await mongoose.connect(env.mongoDbUri, {
			serverSelectionTimeoutMS: 5000,
		});

		status = {
			configured: true,
			validUri: true,
			connected: true,
			message: "MongoDB connected",
		};
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "Unknown MongoDB connection error";

		status = {
			configured: true,
			validUri: true,
			connected: false,
			message,
		};
	}

	return status;
}
