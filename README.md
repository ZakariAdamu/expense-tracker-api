# Expense Tracker API

This folder contains a standalone Express backend for the Finance Pro workspace.

## Scripts

- `npm run dev` - start the server in watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run the compiled server
- `npm run type-check` - run TypeScript type checking only
- `npm run typecheck` - alias for `npm run type-check`

## Environment

Create a `.env` file from `.env.example` and set at least:

- `PORT`
- `NODE_ENV`
- `MONGODBURI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_DEV_URL`
- `FRONTEND_PROD_URL`

The API now uses short-lived access tokens and refresh-token cookies, so both JWT secrets should be set in non-trivial deployments.

## Endpoints

- `GET /` - service metadata
- `GET /api/health` - health check
- `GET /api/summary/portfolio` - sample portfolio summary
- `GET /api/summary/recent-transactions` - sample recent transactions
- `POST /api/users/login` - login and receive auth cookies plus access token
- `POST /api/users/refresh` - refresh the current session

## Local Development

From the backend folder:

```bash
npm install
npm run dev
```

The server listens on port `5000` by default.
