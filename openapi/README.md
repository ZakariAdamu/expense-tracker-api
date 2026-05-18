# API Docs (OpenAPI)

Where the docs live

- The OpenAPI JSON spec: `openapi/openapi.json`
- The generated TypeScript types: `openapi/types.d.ts`
- A preview site (Swagger UI) is served from `docs/` for GitHub Pages and is also mounted at `/docs` when running the app locally.

Commands

- Regenerate the OpenAPI spec from Zod schemas:

```bash
npm run openapi:build
```

- Run the CI check (fails if `openapi/openapi.json` is out-of-date):

```bash
npm run openapi:ci
```

- Generate TypeScript types from the spec:

```bash
npm run openapi:client
```

- Serve locally and view docs (app mounts Swagger UI at `/docs`):

```bash
npm run dev
# open http://localhost:3000/docs
```

How to keep the spec up-to-date

1. Export Zod schemas from your validation locations (current controllers already export the common schemas).
2. Run `npm run openapi:build` to regenerate `openapi/openapi.json`.
3. (Optional) Run `npm run openapi:client` to refresh TypeScript types.
4. Commit `openapi/openapi.json` (the repo includes a CI job that verifies this on push).

Publishing

- Pushing to `main` triggers the `Publish API Docs` workflow which builds the spec, prepares a small static Swagger UI site in `docs/`, and deploys it to GitHub Pages.

Notes

- The generator attempts to map request/response shapes to generated component schemas when property sets match. For complex responses you may need to refine the `openapi/openapi.json` paths manually or extend `src/lib/openapi.ts`.
- If you prefer a richer documentation site (Redoc, custom styling, private docs), I can add that next.
