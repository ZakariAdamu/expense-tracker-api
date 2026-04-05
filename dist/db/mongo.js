"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMongoStatus = getMongoStatus;
exports.initializeMongoConnection = initializeMongoConnection;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
let status = {
    configured: env_1.hasMongoDbUri,
    validUri: isValidMongoUri(env_1.env.mongoDbUri),
    connected: false,
    message: env_1.hasMongoDbUri ? "MongoDB URI configured" : "MONGODBURI is not set",
};
function isValidMongoUri(uri) {
    return uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
}
function getMongoStatus() {
    return status;
}
async function initializeMongoConnection() {
    if (!env_1.hasMongoDbUri) {
        status = {
            configured: false,
            validUri: false,
            connected: false,
            message: "MONGODBURI is not set",
        };
        return status;
    }
    if (!isValidMongoUri(env_1.env.mongoDbUri)) {
        status = {
            configured: true,
            validUri: false,
            connected: false,
            message: "MONGODBURI is invalid. Use mongodb:// or mongodb+srv:// URI format.",
        };
        return status;
    }
    try {
        await mongoose_1.default.connect(env_1.env.mongoDbUri, {
            serverSelectionTimeoutMS: 5000,
        });
        status = {
            configured: true,
            validUri: true,
            connected: true,
            message: "MongoDB connected",
        };
    }
    catch (error) {
        const message = error instanceof Error
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
