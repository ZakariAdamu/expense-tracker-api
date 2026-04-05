import { createApp } from "./app";
import { env } from "./config/env";
import { getMongoStatus, initializeMongoConnection } from "./db/mongo";

function handleServerError(error: NodeJS.ErrnoException) {
	if (error.code === "EADDRINUSE") {
		console.error(
			`Port ${env.port} is already in use. Stop the running process or change PORT in .env.`,
		);
		process.exit(1);
	}

	console.error(`Server failed to start: ${error.message}`);
	process.exit(1);
}

async function startServer() {
	await initializeMongoConnection();
	const mongo = getMongoStatus();

	if (mongo.connected) {
		console.log("MongoDB connection established Successfully ✔.");
	} else {
		console.warn(`MongoDB unavailable: ${mongo.message}`);
	}

	const app = createApp();

	const server = app.listen(env.port, () => {
		console.log(
			`finance-pro-backend listening on http://localhost:${env.port}`,
		);
	});

	server.on("error", handleServerError);
}

void startServer();
