"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const mongo_1 = require("./db/mongo");
function handleServerError(error) {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${env_1.env.port} is already in use. Stop the running process or change PORT in .env.`);
        process.exit(1);
    }
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
}
async function startServer() {
    await (0, mongo_1.initializeMongoConnection)();
    const mongo = (0, mongo_1.getMongoStatus)();
    if (mongo.connected) {
        console.log("MongoDB connection established Successfully ✔.");
    }
    else {
        console.warn(`MongoDB unavailable: ${mongo.message}`);
    }
    const app = (0, app_1.createApp)();
    const server = app.listen(env_1.env.port, () => {
        console.log(`finance-pro-backend listening on http://localhost:${env_1.env.port}`);
    });
    server.on("error", handleServerError);
}
void startServer();
