# QueueLess - Smart Queue Management System

React + Vite + Tailwind frontend, Node/Express backend, MongoDB Atlas (Mongoose), JWT auth (bcryptjs hashing), polling every 5 seconds.

## 0. Fastest path to a live site (about 30 minutes)

1. **Atlas** (section 6): create the M0 cluster, DB user, `0.0.0.0/0` network access, and copy the connection string (with `/queueless` added).
2. **Seed once from your computer**: `cd backend && npm install && cp .env.example .env`, paste `MONGO_URI` and a `JWT_SECRET` into `.env`, then `npm run seed`. WARNING: the seed deletes all users, queues and tokens in that database. Only run it on a database you are happy to wipe.
3. **GitHub**: push the whole `queueless/` folder as one repo (`.env` files are git-ignored).
4. **Render**: New > **Blueprint** > pick the repo. `render.yaml` creates the service and generates `JWT_SECRET` for you. Paste only `MONGO_URI`, and put `http://localhost:5173` in `CLIENT_URL` for now. Wait for the deploy, then open `/api/health`.
5. **Vercel**: Import the repo, Root Directory `frontend`, add `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com/api`, deploy.
6. **Connect**: set `CLIENT_URL` on Render to your Vercel URL (no trailing slash). Render redeploys. Log in with `admin@queueless.com / Admin@123`.

Sections 7-9 below explain the same steps in detail if you prefer the manual route.

## 1. Folder structure

```
queueless/
├── README.md
├── render.yaml            (one-click Render blueprint)
├── postman/QueueLess.postman_collection.json
├── backend/
│   ├── package.json, .env.example, .gitignore, server.js, seed.js
│   ├── config/db.js
│   ├── models/        User.js  Queue.js  Token.js
│   ├── middleware/    auth.js  validate.js  error.js
│   ├── controllers/   authController.js  queueController.js  tokenController.js
│   ├── routes/        authRoutes.js  queueRoutes.js  tokenRoutes.js
│   └── utils/         asyncHandler.js  label.js
└── frontend/
    ├── package.json, .env.example, .gitignore, vercel.json
    ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js
    └── src/
        ├── main.jsx, App.jsx, api.js, index.css
        ├── context/AuthContext.jsx
        ├── hooks/usePolling.js
        ├── components/  Layout.jsx  ProtectedRoute.jsx  ui.jsx
        └── pages/       AuthPage.jsx  Counters.jsx  MyTokens.jsx  AdminDashboard.jsx
```

## 2. Installation

Requires Node 18+.

```bash
cd backend  && npm install
cd ../frontend && npm install
```

## 3. Environment variables

```bash
# backend
cd backend && cp .env.example .env
# frontend
cd ../frontend && cp .env.example .env
```

Backend `.env`: `MONGO_URI` (from Atlas, section 6), `JWT_SECRET` (generate with
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `CLIENT_URL=http://localhost:5173`.
Frontend `.env`: `VITE_API_URL=http://localhost:5000/api`.
`.env` files are git-ignored; never commit them.

## 4. Run locally

```bash
# terminal 1
cd backend && npm run seed && npm run dev      # API on http://localhost:5000
# terminal 2
cd frontend && npm run dev                      # app on http://localhost:5173
```

Demo logins created by the seed: `admin@queueless.com / Admin@123` and `user@queueless.com / User@123`.
Registration always creates normal users; admins exist only through the seed (or by editing a user's `role` in Atlas).

## 5. Postman testing

1. Import `postman/QueueLess.postman_collection.json`.
2. Collection variables: `baseUrl` (default `http://localhost:5000/api`). `token`, `queueId`, `tokenId` fill themselves.
3. Run in order: Health -> Login as user (saves token) -> List queues (saves queueId) -> Generate token (saves tokenId) -> My tokens -> Cancel token.
4. Login as admin -> Create queue -> Call next token -> List tokens -> Close queue.
5. Check permissions: with the user token, `POST /queues` must return 403. Without a token, any route must return 401.

| Method | Path | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/queues, /api/queues/:id | logged in |
| POST | /api/queues | admin |
| PUT / DELETE | /api/queues/:id | admin |
| PATCH | /api/queues/:id/open, /close | admin |
| POST | /api/queues/:id/next | admin |
| GET | /api/queues/:id/tokens | admin |
| POST | /api/tokens `{queueId}` | logged in |
| GET | /api/tokens/my | logged in |
| PATCH | /api/tokens/:id/cancel | owner only |

## 6. MongoDB Atlas setup

1. Sign up at mongodb.com/atlas, create a free **M0** cluster (any region near you).
2. **Database Access** -> Add New Database User -> username + password (use letters/digits only to avoid URL-encoding problems) -> role "Read and write to any database".
3. **Network Access** -> Add IP Address. For local work choose "Add Current IP". For Render, add `0.0.0.0/0` (Render free instances have no fixed IP).
4. **Database** -> Connect -> Drivers -> copy the connection string.
5. Paste it into `backend/.env` as `MONGO_URI`, replace the password placeholder, and put `/queueless` before the `?` so the database is named `queueless`.
6. Run `npm run seed` from `backend` (works against Atlas too).

## 7. Deploy backend on Render

1. Push the project to GitHub (one repo with `backend/` and `frontend/`).
2. render.com -> New -> **Web Service** -> connect the repo.
3. Settings: **Root Directory** `backend`, **Runtime** Node, **Build Command** `npm install`, **Start Command** `npm start`, Instance type Free.
4. Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=production`, `CLIENT_URL` (temporary value `http://localhost:5173`; you update it in section 9).
5. Deploy. Open `https://YOUR-SERVICE.onrender.com/api/health`; you should see `{"status":"ok"}`.
6. Free services sleep after ~15 minutes idle; the first request afterwards takes about 30-60 seconds.

## 8. Deploy frontend on Vercel

1. vercel.com -> Add New -> Project -> import the same repo.
2. **Root Directory** `frontend`. Framework preset: Vite (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL` = `https://YOUR-SERVICE.onrender.com/api` (must end with `/api`).
4. Deploy. `vercel.json` already rewrites all routes to `index.html`, so refreshing `/my-tokens` works.

## 9. Connect deployed frontend and backend

1. Copy your Vercel URL, for example `https://queueless-abc.vercel.app` (no trailing slash).
2. Render -> your service -> Environment -> set `CLIENT_URL` to that URL. Several origins can be comma separated. Save; Render redeploys.
3. Open the Vercel URL and sign in with a demo account. If you changed `VITE_API_URL`, redeploy the frontend (Vite bakes it in at build time).

## 10. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `MongooseServerSelectionError` / connection timeout | Atlas Network Access does not include the server IP. Add `0.0.0.0/0`. |
| `bad auth: Authentication failed` | Wrong DB user/password in `MONGO_URI`. Special characters in the password must be URL-encoded; easiest is to reset the password to letters and digits. |
| Browser shows "CORS blocked" / network error | `CLIENT_URL` on Render does not exactly match the Vercel URL (check `https`, no trailing slash), or you did not redeploy after changing it. |
| Frontend calls `localhost:5000` in production | `VITE_API_URL` not set on Vercel before the build. Set it and redeploy. |
| 404 on page refresh at Vercel | Make sure `frontend/vercel.json` is committed and Root Directory is `frontend`. |
| First request very slow, then fine | Render free tier cold start. Open `/api/health` first, or upgrade the plan. |
| Render build fails: `Cannot find package.json` | Root Directory must be `backend`. |
| `Missing JWT_SECRET or MONGO_URI` in logs | Environment variables not set on Render. |
| 401 right after login | `JWT_SECRET` changed after tokens were issued. Log in again. |
| Login fails after deploying with an empty database | Run `npm run seed` locally with the Atlas `MONGO_URI`. |

## How it works (for your viva or demo)

- **Token numbers**: `Queue.lastNumber` is incremented atomically with `$inc`, so two users never get the same number.
- **Waiting time**: tokens ahead of you x the queue's average service time.
- **Call next**: the admin action marks the token being served as `served`, then promotes the lowest-numbered `waiting` token to `serving`.
- **Polling**: `usePolling` refetches every 5 seconds and pauses while the browser tab is hidden.
- **Security**: passwords are hashed, secrets live only in `.env`, JWT is verified on every protected route, and admin routes check `role === 'admin'`.
- **Note**: `bcryptjs` is used instead of native `bcrypt`; same algorithm and hash format, but it installs on Render without compiling native code.

## Suggested 40-minute schedule

| Min | Task |
|---|---|
| 0-5 | Unzip, `npm install` in both folders |
| 5-12 | Atlas cluster, user, network access, connection string, `.env` |
| 12-17 | Seed, run both servers, test login (admin and user) |
| 17-22 | Import Postman collection and run the requests |
| 22-24 | Push to GitHub |
| 24-32 | Render backend deploy and health check |
| 32-38 | Vercel frontend deploy, then set `CLIENT_URL` on Render |
| 38-40 | Final smoke test on the live URLs |
