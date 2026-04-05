"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMongoDbUri = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function parsePort(value, fallback) {
    const parsed = Number(value ?? fallback);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
exports.env = {
    port: parsePort(process.env.PORT, 4000),
    mongoDbUri: process.env.MONGODBURI ?? process.env.MOGODBURI ?? "",
};
exports.hasMongoDbUri = exports.env.mongoDbUri.length > 0;
