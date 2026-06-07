import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initializeMongoConnection } from "./db/mongo.js";

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
  let attemptsLeft = env.mongoRetries;
  let mongoStatus = await initializeMongoConnection();

  while (!mongoStatus.connected && attemptsLeft > 0) {
    console.warn(
      `MongoDB connection failed: ${mongoStatus.message}. Retrying (${attemptsLeft} attempts left)...`,
    );
    if (mongoStatus.errorStack) {
      console.error("MongoDB error stack:", mongoStatus.errorStack);
    }
    await new Promise((r) => setTimeout(r, env.mongoRetryDelayMs));
    attemptsLeft -= 1;
    mongoStatus = await initializeMongoConnection();
  }

  if (!mongoStatus.connected) {
    console.error(`MongoDB connection failed: ${mongoStatus.message}`);
    if (mongoStatus.errorStack) {
      console.error("MongoDB stack:", mongoStatus.errorStack);
    }
    process.exit(1);
  }

  console.log(
    "🟢 MongoDB connection established successfully 🚀. Starting server...",
  );

  const app = createApp();

  const port = app.get("env.port");
  const host = app.get("env.host");

  const server = app.listen(port, host, () => {
    const displayUrl =
      env.nodeEnv === "production" ? `port ${port}` : `http://${host}:${port}`;
    console.log(
      `🟢 finance-pro-backend listening on ${displayUrl} 🚀🚀 Happy coding! 🚀🚀`,
    );
  });

  server.on("error", handleServerError);
}

void startServer();
