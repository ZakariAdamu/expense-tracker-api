#!/usr/bin/env tsx
import fs from "fs";
import path from "path";

async function main() {
	const outArgIndex = process.argv.indexOf("--out");
	const outPath =
		outArgIndex !== -1
			? process.argv[outArgIndex + 1]
			: path.join(process.cwd(), "openapi", "openapi.json");

	// Dynamically import to avoid type issues if package not installed
	let zodToJsonSchema: any;
	try {
		zodToJsonSchema = (await import("zod-to-json-schema")).zodToJsonSchema;
	} catch (err) {
		console.error(
			"Missing dependency 'zod-to-json-schema'. Please run: npm i -D zod-to-json-schema",
		);
		process.exit(1);
	}

	// Import exported Zod schemas from controllers
	const {
		signupSchema,
		loginSchema,
		updateProfileSchema,
		changePasswordSchema,
	} = await import("../controllers/userController.ts");
	const { incomeSchema, incomeUpdateSchema } =
		await import("../controllers/incomeController.ts");
	const { expenseSchema, expenseUpdateSchema } =
		await import("../controllers/expenseController.ts");

	// read base spec if exists
	const basePath = path.join(process.cwd(), "openapi", "openapi.json");
	let base: any = {};
	if (fs.existsSync(basePath)) {
		base = JSON.parse(fs.readFileSync(basePath, "utf8"));
	}

	const components = base.components || {};
	components.schemas = components.schemas || {};

	// helper to convert and attach
	function addSchema(name: string, schema: any) {
		try {
			const json = zodToJsonSchema(schema, name);
			// zod-to-json-schema may return a wrapper with `definitions[name]` — extract the actual schema
			let actual = json;
			if (json && typeof json === "object") {
				if (json.definitions && json.definitions[name]) {
					actual = json.definitions[name];
				}
				if (actual && actual.$schema) delete actual.$schema;
			}
			components.schemas[name] = actual;
		} catch (e) {
			const msg = (e as any)?.message ?? e;
			console.warn(`Failed to convert schema ${name}:`, msg);
		}
	}

	addSchema("Signup", signupSchema);
	addSchema("Login", loginSchema);
	addSchema("UpdateProfile", updateProfileSchema);
	addSchema("ChangePassword", changePasswordSchema);
	addSchema("Income", incomeSchema);
	addSchema("IncomeUpdate", incomeUpdateSchema);
	addSchema("Expense", expenseSchema);
	addSchema("ExpenseUpdate", expenseUpdateSchema);

	// Attempt to replace inline schemas in paths with $ref to generated components
	function getProps(obj: any) {
		if (!obj) return [];
		if (obj.properties && typeof obj.properties === "object") {
			return Object.keys(obj.properties);
		}
		if (obj.definitions && typeof obj.definitions === "object") {
			// try to find a definition that matches
			const keys = Object.keys(obj.definitions);
			if (keys.length > 0) {
				const def = obj.definitions[keys[0]];
				if (def && def.properties) return Object.keys(def.properties);
			}
		}
		return [];
	}

	const schemaPropMap: Record<string, string[]> = {};
	for (const name of Object.keys(components.schemas)) {
		const s = components.schemas[name];
		schemaPropMap[name] = getProps(s);
	}

	if (base.paths && typeof base.paths === "object") {
		for (const pathKey of Object.keys(base.paths)) {
			const pathItem = base.paths[pathKey];
			for (const methodKey of Object.keys(pathItem)) {
				const op = pathItem[methodKey];
				// requestBody
				const reqSchema =
					op?.requestBody?.content?.["application/json"]?.schema;
				if (reqSchema) {
					const reqProps = getProps(reqSchema);
					for (const [schemaName, props] of Object.entries(schemaPropMap)) {
						// compare sets
						const a = props.slice().sort().join("|");
						const b = reqProps.slice().sort().join("|");
						if (a && a === b) {
							op.requestBody.content["application/json"].schema = {
								$ref: `#/components/schemas/${schemaName}`,
							};
							break;
						}
					}
				}

				// responses (try 200/201)
				if (op.responses && typeof op.responses === "object") {
					for (const status of ["200", "201"]) {
						const respSchema =
							op.responses[status]?.content?.["application/json"]?.schema;
						if (respSchema) {
							const respProps = getProps(respSchema);
							for (const [schemaName, props] of Object.entries(schemaPropMap)) {
								const a = props.slice().sort().join("|");
								const b = respProps.slice().sort().join("|");
								if (a && a === b) {
									op.responses[status].content["application/json"].schema = {
										$ref: `#/components/schemas/${schemaName}`,
									};
									break;
								}
							}
						}
					}
				}
			}
		}
	}

	const out = {
		openapi: base.openapi || "3.0.3",
		info: base.info || { title: "Expense Tracker API", version: "1.0.0" },
		servers: base.servers || [{ url: "http://localhost:3000" }],
		paths: base.paths || {},
		components,
	};

	const outDir = path.dirname(outPath);
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
	console.log("OpenAPI spec generated to", outPath);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
