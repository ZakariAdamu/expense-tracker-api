"use strict";

const { execSync } = require("node:child_process");

if (!process.env.CI) {
	execSync("kill-port 4000", { stdio: "inherit" });
}
