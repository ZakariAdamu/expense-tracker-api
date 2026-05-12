import dotenv from "dotenv";
dotenv.config();
function parsePort(value, fallback) {
    const parsed = Number(value ?? fallback);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
export const env = {
    port: parsePort(process.env.PORT, 5000),
    mongoDbUri: process.env.MONGODBURI ?? process.env.MOGODBURI ?? "",
};
export const hasMongoDbUri = env.mongoDbUri.length > 0;
