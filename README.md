# WDC Learning Portal

A WDC-specific learning and recruitment preparation portal. The first student release includes account authentication, a seeded UI/UX learning roadmap, curated resources and tasks, completion tracking, student profiles, and recruitment Round 2 information.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

Configure the backend first. A private local `server/.env` is set up for the MongoDB instance on this development machine. If that file is missing on another machine, copy `.env.example` to `.env`, then set `MONGODB_URI` to a local MongoDB instance or MongoDB Atlas connection string. For Atlas, use the `wdc-learning-portal` database name in the URI. The backend can start without a database URI for API-only development, but database-dependent features will require a connection.

Keep database credentials private. Store the local connection string only in `server/.env` (ignored by Git), and configure `MONGODB_URI` as a server-side environment variable on your deployment host. Never put it in client-side environment variables or commit it to the repository. If a database password has been shared in chat or another public place, rotate it in Atlas before using the connection string.

In one terminal:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The frontend proxies `/api` requests to the backend at `http://localhost:5000`.

The backend exposes `GET /api/health` for liveness and `GET /api/health/ready` for readiness. Readiness reports unavailable when a database URI is configured but MongoDB is not connected. CORS allows the origin(s) in `CLIENT_ORIGIN`; provide multiple comma-separated origins when needed.

Authentication also requires a strong secret. Set `JWT_SECRET` to a unique random value of at least 32 characters; do not use the placeholder from `.env.example` in production. The app uses an HTTP-only session cookie and hashes passwords with bcrypt.

After MongoDB is configured, seed the initial UI/UX learning content once (or again after editing the seed definitions):

```bash
cd server
npm run seed
```

The seed is safe to rerun: it upserts the UI/UX track, resources, practice tasks, and Round 2 by stable identifiers. It does not delete student data.

Run backend tests with `npm test`; build the frontend with `npm run build` from `client/`.

## Implemented student features

- Register, log in, log out, and restore a session.
- Edit basic profile details and choose the UI/UX track.
- View the dashboard, four-week roadmap, curated resources, practice tasks, and recruitment information.
- Mark topics and tasks complete. Progress percentage and next step are calculated from the roadmap and completed items.

Round 3 is supported by the recruitment-round model and endpoints; only Round 2 is seeded. Senior content-management APIs are available, but a dedicated admin UI and file submissions are not included in this release.

## WDC senior content management

Content management endpoints are protected by both authentication and the `admin` role:

- `GET /api/admin/content` lists tracks, resources, tasks, and recruitment rounds.
- `POST /api/admin/content/tracks|resources|tasks|rounds` creates or upserts by slug/round number.
- `PATCH /api/admin/content/:type/:id` updates supported fields.
- `DELETE /api/admin/content/:type/:id` deletes a content record.

Create the student account normally, then promote it from a trusted development/deployment shell. Never expose this operation as a public endpoint:

```bash
cd server
npm run promote-admin -- senior@example.org
```

Production index creation is explicit. The Render Blueprint runs `npm run db:indexes` during its one-time initialization hook. For other hosts, run that command after configuring the production database and before starting the service. It creates/verifies model indexes without dropping unrelated indexes. Resolve duplicate existing values before adding unique indexes.

MongoDB indexes are created automatically outside production. In production, manage indexes as part of deployment instead of having the app create them at startup.

## Deployment environment

Configure these variables on the backend hosting service:

- `NODE_ENV=production`
- `MONGODB_URI` with the rotated Atlas connection string for `wdc-learning-portal`
- `CLIENT_ORIGIN` with the deployed frontend's exact origin (scheme and hostname)
- `PORT` only if the hosting provider does not set it automatically

For the Vercel setup below, no frontend API environment variable is needed: Vercel proxies `/api/*` to Render on the same site, which keeps the HTTP-only cookie first-party. For a different hosting arrangement without that proxy, configure `VITE_API_BASE_URL` with the backend's HTTPS origin. Never expose database or JWT secrets to the frontend build.

## Deployment checklist

1. Push this repository to GitHub, then connect the repository to Render and Vercel. This workspace currently has no Git remote configured, so the hosting providers cannot deploy it until the source is pushed and connected.
2. In Render, create a Blueprint from the repository root. [render.yaml](render.yaml) defines the API service and will prompt for `MONGODB_URI`; it generates a strong `JWT_SECRET`. Supply a rotated Atlas URI for the production database, not the credential previously shared in chat. Configure Atlas network access for the backend host and keep database permissions scoped to this app database.
3. At each API startup, Render creates/verifies indexes and idempotently seeds the initial UI/UX content and Round 2 before starting Express. This supports the Free plan, which does not allow pre-deploy commands, and can reseed missing content on a restart without duplicating it. Verify the API at `https://wdc-learning-portal-api.onrender.com/api/health/ready`. The Free Render service may sleep while idle and take time to wake.
4. In Vercel, import the same repository and set the project root to `client`. The checked-in Vercel configuration builds the SPA, supports direct client-route visits, and proxies `/api/*` to the Render service so browser session cookies are same-origin. If the Render service gets a different hostname, update its API destination in [client/vercel.json](client/vercel.json) before deploying.
5. Set Render's `CLIENT_ORIGIN` to the exact Vercel production origin shown in its project Domains settings (for example, `https://wdc-learning-portal.vercel.app`). Add any custom student-facing domain there as well, comma-separated if needed, then redeploy the API. Do not use `*` for credentialed requests.
6. After Vercel is deployed, verify the production home page, `/login`, a direct visit to `/roadmap`, registration/login, session restoration, marking one item complete, and logout. Check the Render readiness endpoint and both providers' build/runtime logs.
7. Promote at least one trusted senior account only after that account has registered: from a trusted shell configured with the production database, run `npm run promote-admin -- senior@example.org` in `server/`.

The providers own TLS and deployment. Do not put `MONGODB_URI` or `JWT_SECRET` into Vercel variables; the frontend only talks to the backend through the `/api` rewrite.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/tracks`, `GET /api/tracks/:trackId`, `GET /api/roadmap/:trackId`
- `GET /api/resources`, `GET /api/resources/:id`
- `GET /api/tasks`, `GET /api/tasks/:id`
- `GET /api/student/dashboard`, `GET|PATCH /api/student/profile`
- `GET /api/student/progress`, `POST /api/student/progress/complete`
- `GET /api/recruitment-rounds`, `GET /api/recruitment-rounds/:roundNumber`

Student routes require the HTTP-only session cookie. Public read endpoints serve published tracks, resources, tasks, and recruitment rounds.
