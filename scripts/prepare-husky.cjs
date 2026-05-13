"use strict";

if (process.env.NODE_ENV === "development") {
	try {
		require("husky").install();
	} catch (error) {
		if (error?.code !== "MODULE_NOT_FOUND") {
			throw error;
		}
	}
}
