import dotenv from "dotenv";

dotenv.config();

function parsePort(value: string | undefined, fallback: number) {
	const parsed = Number(value ?? fallback);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
	port: parsePort(process.env.PORT, 4000),
	mongoDbUri: process.env.MONGODBURI ?? process.env.MOGODBURI ?? "",
};

export const hasMongoDbUri = env.mongoDbUri.length > 0;
