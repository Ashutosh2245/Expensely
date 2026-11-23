# EXPENSELY - Production Deployment & Operations Guide

> **Target Architecture**: Frontend on **Vercel** (React + Vite SPA) | Backend on **Render** (Express.js + Socket.io Persistent Web Service) | Database on **MongoDB Atlas** (Mongoose with Connection Pooling) | Storage on **Cloudinary** (Receipts & Avatars) | CI/CD on **GitHub Actions**  
> **Guiding Principle**: Zero self-managed VPS/EC2. Pure managed cloud infrastructure with automated zero-downtime deployments.

---

## Table of Contents
1. [Section A: MongoDB Atlas Setup](#section-a-mongodb-atlas-setup)
2. [Section B: Google Cloud OAuth 2.0 Setup](#section-b-google-cloud-oauth-20-setup)
3. [Section C: Cloudinary Media Storage Setup](#section-c-cloudinary-media-storage-setup)
4. [Section D: GitHub Repository & CI/CD Setup](#section-d-github-repository--cicd-setup)
5. [Section E: Render Backend Deployment](#section-e-render-backend-deployment)
6. [Section F: Vercel Frontend Deployment](#section-f-vercel-frontend-deployment)
7. [Section G: Production CORS, Headers & Cookie Strategy](#section-g-production-cors-headers--cookie-strategy)
8. [Section H: Socket.io Real-Time Synchronization Verification](#section-h-socketio-real-time-synchronization-verification)
9. [Section I: Health Check & System Monitoring](#section-i-health-check--system-monitoring)
10. [Section J: End-to-End Production Smoke Test Checklist](#section-j-end-to-end-production-smoke-test-checklist)
11. [Section K: Custom Domains & SSL Certification](#section-k-custom-domains--ssl-certification)
12. [Section L: Troubleshooting & Diagnostic Guide](#section-l-troubleshooting--diagnostic-guide)

---

## Section A: MongoDB Atlas Setup

MongoDB Atlas provides fully managed cloud database storage with automated backups, replica sets, and scaling.

### Step 1: Create an Atlas Cluster
1. Sign in to your [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. Select your Project, click **Create**, and choose **M0 (Free)** or higher tier.
3. Select your preferred Cloud Provider (AWS, GCP, or Azure) and choose a region closest to your Render service region (e.g., `us-east-1` or `frankfurt`).
4. Click **Create Deployment**.

### Step 2: Configure Database User Authentication
1. Navigate to **Security** > **Database Access**.
2. Click **Add New Database User**.
3. Select **Password** Authentication Method:
   - **Username**: `expensely_prod_user`
   - **Password**: Generate a strong password (minimum 24 alphanumeric characters). *Avoid characters requiring URL encoding like `#`, `?`, `/`, `@`*.
4. Under **Database User Privileges**, select **Read and write to any database** (or restrict to `expensely`).
5. Click **Add User**.

### Step 3: Configure Network Access (IP Access List)
Render Web Services operate on dynamic, multi-tenant IP pools. To ensure uninterrupted connectivity:
1. Navigate to **Security** > **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Set an entry comment: `Render Production Dynamic IPs`.
5. Click **Confirm**.

### Step 4: Extract the Connection String
1. Return to the **Database Deployments** tab.
2. Click **Connect** next to your cluster.
3. Choose **Drivers** > Select **Node.js** (version 5.5 or later).
4. Copy the connection string format:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/expensely?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials. Notice the `/expensely` database name specified in the path.

---

## Section B: Google Cloud OAuth 2.0 Setup

Google OAuth enables passwordless, one-tap identity verification for users.

### Step 1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: `Expensely Production`.

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required application details:
   - **App name**: `Expensely`
   - **User support email**: Your admin/support email.
   - **Developer contact information**: Your contact email.
4. Under **Scopes**, add:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Save and proceed to **Publishing status** > Set to **In Production** (or add test users if verifying in staging).

### Step 3: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `Expensely Web & API Client`.
5. **Authorized JavaScript origins**:
   - `https://expensely.vercel.app` (your production frontend URL)
   - `http://localhost:5173` (local development)
6. **Authorized redirect URIs**:
   - `https://expensely-api.onrender.com/api/auth/google/callback` (production backend callback)
   - `http://localhost:5000/api/auth/google/callback` (local development callback)
7. Click **Create**.
8. Safely copy the **Client ID** and **Client Secret**.

---

## Section C: Cloudinary Media Storage Setup

Cloudinary handles cloud storage for user avatar pictures and expense bill receipts, eliminating ephemeral disk dependencies.

### Step 1: Retrieve Account Credentials
1. Sign in to your [Cloudinary Dashboard](https://cloudinary.com/console).
2. On your **Dashboard Summary**, copy:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)

### Step 2: Configure Upload Safeguards
- Supported MIME Types: `image/jpeg`, `image/png`, `image/webp`.
- Maximum File Size: 5MB per upload.
- Transformations: Receipts and profile pictures are automatically organized under `expensely/` folders with secure HTTPS delivery.

---

## Section D: GitHub Repository & CI/CD Setup

Source code is centrally hosted on GitHub with automated verification on every commit.

### Step 1: Repository Structure
Verify that your repository on `https://github.com/Ashutosh2245/Expensely.git` contains:
```text
Expensely/
├── .github/workflows/
│   ├── ci.yml                 # Node 22 test runner & Vite build check
│   └── docker-ci.yml          # Docker Buildx multi-stage build check
├── backend/
│   ├── Dockerfile
│   ├── render.yaml            # Render Blueprint configuration
│   ├── src/
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json            # Vercel SPA rewrite rules
│   ├── src/
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
└── DEPLOYMENT.md
```

### Step 2: CI Verification
Upon pushing commits to `main`:
- `ci.yml` runs:
  1. Backend unit and integration tests (15 test suites with financial balance assertions) using Node.js 22.
  2. Frontend TypeScript type checking and production Vite bundling (`npm run build`).
- `docker-ci.yml` executes container compilation for backend and frontend Dockerfiles.

---

## Section E: Render Backend Deployment

Render hosts the persistent Node.js Express + Socket.io backend Web Service.

### Option 1: Using render.yaml Blueprint (Recommended)
1. Sign in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `Ashutosh2245/Expensely`.
4. Render automatically reads `backend/render.yaml` and provisions the Web Service `expensely-api`.
5. Enter the sensitive environment variables in the Render dashboard prompts.

### Option 2: Manual Web Service Setup
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository `Ashutosh2245/Expensely`.
3. Configure the service settings:
   - **Name**: `expensely-api`
   - **Region**: Choose the region closest to your MongoDB Atlas cluster (e.g., Oregon, Ohio, Frankfurt).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or Starter (persistent service, non-serverless).
4. Under **Health Check Path**, enter:
   ```text
   /api/health
   ```
5. Click **Advanced** > **Add Environment Variables**:

| Variable Name | Required Value / Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | `production` |
| `PORT` | `10000` (Render default; binds dynamically) | `10000` |
| `FRONTEND_URL` | Your live Vercel domain | `https://expensely.vercel.app` |
| `CLIENT_URL` | Same as `FRONTEND_URL` | `https://expensely.vercel.app` |
| `BACKEND_URL` | Your Render backend URL | `https://expensely-api.onrender.com` |
| `MONGODB_URI` | MongoDB Atlas SRV URI with database name | `mongodb+srv://user:pass@cluster.mongodb.net/expensely?retryWrites=true&w=majority` |
| `JWT_SECRET` | 32+ character random secret string | `prod_jwt_super_secret_access_key_2026_xyz` |
| `JWT_REFRESH_SECRET`| 32+ character random secret string | `prod_jwt_super_secret_refresh_key_2026_xyz` |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `xxxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-xxxxxx` |
| `GOOGLE_CALLBACK_URL` | Render callback route | `https://expensely-api.onrender.com/api/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | `abcdefghijklmnopqrstuvwxyz` |

6. Click **Create Web Service**. Wait for the build and deployment to succeed.

---

## Section F: Vercel Frontend Deployment

Vercel provides edge CDN hosting, automated SSL, and instant preview branches for the React + Vite frontend.

### Step 1: Connect Repository to Vercel
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository: `Ashutosh2245/Expensely`.

### Step 2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click Edit, select `frontend`, and click **Continue**.
- **Build Command**: `npm run build` (or leave default Vite configuration).
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Frontend Environment Variables
In the **Environment Variables** section, configure:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://expensely-api.onrender.com/api` | Base URL for REST API requests |
| `VITE_SOCKET_URL` | `https://expensely-api.onrender.com` | Base URL for WebSocket connections |
| `VITE_GOOGLE_CLIENT_ID`| `xxxxxx.apps.googleusercontent.com` | Google OAuth Web Client ID |

> **Security Reminder**: All `VITE_*` variables are embedded into client bundle assets at build time. Never place secrets or private keys in frontend variables.

### Step 4: Verify SPA Client-Side Routing
The repository includes `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures that direct navigations or browser refreshes on routes like `/groups/65f12345` or `/analytics` correctly route to `/index.html` without 404 errors.

---

## Section G: Production CORS, Headers & Cookie Strategy

### CORS Configuration
Cross-origin requests from the Vercel frontend to the Render API require explicit origin whitelisting with credentials.
- `app.js` automatically permits:
  1. Origins matching `FRONTEND_URL` / `CLIENT_URL`.
  2. Any Vercel preview domain matching `https://*.vercel.app`.
  3. Standard local development origins (`http://localhost:5173`, `http://localhost:3000`).
- Headers configured: `Allow-Credentials: true`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`.

### Security Headers (Helmet)
Express integrates Helmet with a content security policy adjusted for cross-origin assets:
- `Cross-Origin-Resource-Policy: cross-origin` (permits Cloudinary images and avatars).
- `Strict-Transport-Security: max-age=15552000; includeSubDomains`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: SAMEORIGIN`.

### Cookie Strategy (Cross-Origin Architecture)
- Since the Vercel frontend (`expensely.vercel.app`) and Render backend (`expensely-api.onrender.com`) reside on distinct top-level domains, modern browsers (Chrome, Safari ITP, Firefox) classify third-party cookies strictly.
- **Expensely's Resilient Hybrid Strategy**:
  1. Access tokens are transmitted via the standard `Authorization: Bearer <token>` HTTP header.
  2. The Axios interceptor (`frontend/src/services/api.ts`) automatically intercepts expired tokens, issues a refresh request to `/api/auth/refresh-token`, rotates the token pair, and replays the original request transparently.
  3. Refresh tokens are persisted securely in database records with automatic rotation and revocation on logout.

---

## Section H: Socket.io Real-Time Synchronization Verification

Socket.io connects authenticated clients to group-specific rooms for real-time collaboration.

### Transport and Upgrade Path
- Render Web Services natively support HTTP Upgrade headers for WebSockets (`ws://` and `wss://`).
- The frontend client attempts WebSocket transport first with automatic polling fallback:
  ```ts
  transports: ['websocket', 'polling']
  ```

### Verification Steps
1. Open the deployed frontend in two separate browser windows (or incognito).
2. Log into both windows with two different group member accounts.
3. In Window A, add an expense inside a shared group.
4. Observe Window B:
   - The expense appears instantly in the transaction list without manual page reload.
   - The group member balances update immediately.
   - The activity feed registers the action in real time.
5. In your browser's Developer Tools > **Network** tab > filter by **WS**:
   - Check the `socket.io/?EIO=4&transport=websocket` connection.
   - Status code must be `101 Switching Protocols`.

### Future Multi-Instance Horizontal Scaling Note
- When scaling Render backend instances beyond a single worker, Socket.io instances must share room state via an adapter:
  - Install `@socket.io/redis-adapter` and `ioredis`.
  - Attach the adapter using a managed Redis instance (e.g., Upstash or Render Redis).

---

## Section I: Health Check & System Monitoring

The backend exposes an unauthenticated health probe at `/api/health`.

### Verification Command
Run the following curl command against your live Render service:
```bash
curl -i https://expensely-api.onrender.com/api/health
```

### Expected Response
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ok",
  "service": "expensely-api",
  "database": "connected",
  "timestamp": "2026-11-23T18:15:30.123Z"
}
```

If the database is unreachable or disconnected, the endpoint returns HTTP 503:
```json
{
  "status": "degraded",
  "service": "expensely-api",
  "database": "disconnected",
  "timestamp": "2026-11-23T18:15:30.123Z"
}
```

---

## Section J: End-to-End Production Smoke Test Checklist

Execute these checks immediately after deployment:

- [ ] **1. Health Check**: Run `curl -s https://<render-url>/api/health` and verify `"database": "connected"`.
- [ ] **2. User Registration**: Register a new user via `/register` (unique username, email, strong password). Verify redirect to Dashboard.
- [ ] **3. User Login**: Log out and log back in via `/login`. Verify JWT storage and authentication context.
- [ ] **4. Google OAuth**: Test "Continue with Google" authentication flow. Ensure redirect back to frontend.
- [ ] **5. Create Group**: Create a new group (e.g., "Goa Trip 2026"). Verify group code and invite link generation.
- [ ] **6. Add Group Members**: Add a friend or accept an invitation via invite code `/groups/join`.
- [ ] **7. Add Expense (Equal Split)**: Add an expense of ₹1200 split equally among 3 members. Verify exact balances (₹400 each).
- [ ] **8. Add Expense (Exact / Percentage Split)**: Add a non-equal split expense. Verify backend integer-paise math validation.
- [ ] **9. Upload Receipt**: Attach a PNG/JPEG receipt to an expense. Verify upload to Cloudinary and preview display.
- [ ] **10. Real-Time Sync**: Ensure another member in the group sees the new expense instantly via WebSocket.
- [ ] **11. Settlement (Settle Up)**: Settle a debt between two members. Verify that the debt simplification algorithm recalculates balances.
- [ ] **12. SPA Refresh Test**: Navigate to `/groups/<id>` and hard refresh the browser (`Ctrl+F5` / `Cmd+Shift+R`). Verify no 404 error occurs.
- [ ] **13. Export PDF Report**: Download the group settlement report from Group Details. Verify PDF generation.

---

## Section K: Custom Domains & SSL Certification

Both Vercel and Render provide automated SSL certificates through Let's Encrypt.

### Frontend Custom Domain (Vercel)
1. Go to **Vercel Dashboard** > Project > **Settings** > **Domains**.
2. Add your apex domain (`expensely.com`) and subdomain (`www.expensely.com`).
3. Configure your DNS records at your domain registrar:
   - `A` record: `@` -> `76.76.21.21`
   - `CNAME` record: `www` -> `cname.vercel-dns.com`

### Backend Custom Domain (Render)
1. Go to **Render Dashboard** > `expensely-api` > **Settings** > **Custom Domains**.
2. Add your API domain: `api.expensely.com`.
3. Configure your DNS provider:
   - `CNAME` record: `api` -> `expensely-api.onrender.com`
4. Once DNS propagates, update `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel to `https://api.expensely.com`.
5. Update `FRONTEND_URL` in Render to `https://expensely.com`.

---

## Section L: Troubleshooting & Diagnostic Guide

### Issue 1: CORS Error in Browser Console (`Access-Control-Allow-Origin`)
- **Symptom**: Browser blocks requests with `No 'Access-Control-Allow-Origin' header is present`.
- **Cause**: The Render backend's `FRONTEND_URL` environment variable does not match the exact Vercel frontend URL (including protocol or trailing slash).
- **Fix**: In Render settings, ensure `FRONTEND_URL` is set to `https://your-app.vercel.app` without a trailing slash.

### Issue 2: MongoDB Connection Timeout (`MongooseServerSelectionError`)
- **Symptom**: Render backend logs show `MongoServerSelectionError: connection timed out`.
- **Cause**: Atlas Network Access does not permit connections from Render's dynamic IP range.
- **Fix**: Open MongoDB Atlas > **Network Access** > Verify `0.0.0.0/0` is listed and active.

### Issue 3: Page Refresh Results in 404 on Vercel
- **Symptom**: Loading `https://app.vercel.app/groups/123` directly returns a 404 page.
- **Cause**: Vercel is treating the route as a static file path instead of routing to the SPA router.
- **Fix**: Ensure `frontend/vercel.json` exists with the rewrite rule mapping `/(.*)` to `/index.html`.

### Issue 4: Socket.io Fails to Connect (`polling err` or infinite reconnection)
- **Symptom**: Frontend console shows `WebSocket connection failed`.
- **Cause**: `VITE_SOCKET_URL` is misconfigured or pointing to `/` instead of the Render backend URL.
- **Fix**: Set `VITE_SOCKET_URL=https://expensely-api.onrender.com` in Vercel environment variables and trigger a redeployment.

### Issue 5: Cloudinary Upload Fails (`Must supply cloud_name`)
- **Symptom**: Uploading receipt logs `Cloudinary credentials missing`.
- **Cause**: Missing `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, or `CLOUDINARY_API_SECRET`.
- **Fix**: Enter all three credentials in Render Environment Variables. (Note: The backend gracefully falls back to local buffer memory if Cloudinary is not configured).
