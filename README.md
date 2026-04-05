# Expense Tracker API

This folder contains a standalone Express backend for the Finance Pro workspace.

## Scripts

- `npm run dev` - start the server in watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run the compiled server
- `npm run typecheck` - run TypeScript type checking only

## Endpoints

- `GET /` - service metadata
- `GET /health` - health check
- `GET /api/summary` - sample portfolio summary and recent transactions

## Local Development

From the backend folder:

```bash
npm install
npm run dev
```

The server listens on port `4000` by default.
