# EXPENSELY – Smart Expense Splitting & Collaborative Management Platform

> **"Split Smart. Live Better."**
> 
> Production-grade, zero-EC2 cloud financial SaaS platform inspired by Splitwise. Engineered with a dark navy & emerald fintech aesthetic, integer-paise financial precision, real-time WebSocket synchronization, and an optimal Min-Cash-Flow debt simplification engine.

---

## 🌟 Key Highlights & Engineering Features

- **Zero Self-Managed VPS / EC2**: Purpose-built for modern managed cloud deployment:
  - **Frontend**: Vercel (React 18 + Vite + TypeScript SPA with edge CDN & SPA rewrites).
  - **Backend**: Render (Node.js Express + Socket.io persistent Web Service with `/api/health` probes).
  - **Database**: MongoDB Atlas (Cloud replica set with Mongoose connection pooling).
  - **Media Storage**: Cloudinary (Direct-to-cloud streams for avatars and expense receipts).
  - **CI/CD**: GitHub Actions (Automated Node 22 test suite and Docker multi-stage build verification).
- **Docker & Docker Compose**: Full containerization for backend (Node 22-alpine multi-stage with non-root security), frontend (Nginx alpine with SPA routing and gzip), and persistent MongoDB 7.0 services.
- **Integer Paise Financial Precision**: Zero floating-point rounding discrepancies. All financial amounts internally operate strictly on integer paise, guaranteeing that group balance invariant `∑(netBalances) = 0` is strictly maintained.
- **Min-Cash-Flow Debt Simplification**: Proprietary greedy settlement algorithm that transforms multi-member, multi-expense debts into the absolute minimum number of peer-to-peer settlement transactions.
- **Dual Authentication**:
  - **Google OAuth 2.0**: Native Google Identity Services with verified token exchange and auto-provisioning.
  - **Username & Password**: Case-insensitive globally unique usernames with real-time availability checking, salted bcrypt password hashing, and JWT refresh token rotation.
- **Multi-User Collaborative Architecture**: All group members share a single MongoDB group identity in real time.
- **WebSocket (Socket.io) Rooms**: Authenticated rooms (`group:<groupId>`) broadcast events (`expense:created`, `expense:deleted`, `balance:updated`, `settlement:created`, `member:joined`) to all active peers immediately.
- **Comprehensive Expense Splitting**:
  - **Equal Split**: Even division with automated 1-paisa remainder distribution to maintain exact totals.
  - **Exact Split**: Custom individual currency shares with real-time discrepancy indicators.
  - **Percentage Split**: Custom percentile breakdowns with sum validation to 100%.
- **Settle Up Module**: Complete settlement workflow with statuses (`PENDING`, `CONFIRMED`, `REJECTED`), payment methods (UPI, Cash, Bank Transfer), and receipts. Only confirmed settlements impact group balances.
- **Rich Analytics & Reports**: Recharts area/donut/bar graphs, custom date range filtering, export to CSV, and client-side monthly report PDF generation.
- **Zero-Setup Embedded Database**: Connects to `MONGODB_URI` when provided, or automatically starts an embedded in-memory MongoDB instance for effortless zero-config testing and evaluation!

---

## 🏗️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, Framer Motion, Lucide React, Recharts, Axios, Socket.io Client, jsPDF |
| **Backend** | Node.js 22, Express.js 4, Socket.io 4, Helmet 8, CORS, Express Rate Limit, Zod, Nodemailer, Multer |
| **Database** | MongoDB Atlas / MongoDB 7.0, Mongoose 8 (Connection pooling: `min: 2`, `max: 10`) |
| **Cloud Storage** | Cloudinary (Avatars & Receipts with direct buffer upload) |
| **Cloud Platforms** | Vercel (Frontend SPA), Render (Backend Web Service) |
| **Containerization** | Docker, Docker Compose, Nginx Alpine, Multi-Stage Builds |
| **CI/CD** | GitHub Actions (`ci.yml`, `docker-ci.yml`) |

---

## 📁 Project Structure

```text
Expensely/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Node 22 test runner & Vite build verification
│       └── docker-ci.yml              # Docker Buildx multi-stage build check
│
├── frontend/
│   ├── src/
│   │   ├── components/                # StatCard, Modal, Navbar, Sidebar, LoadingSkeleton, EmptyState
│   │   ├── context/                   # AuthContext, NotificationContext
│   │   ├── layouts/                   # AppLayout
│   │   ├── pages/                     # 17 Pages (Landing, Dashboard, Groups, AddExpense, SettleUp, etc.)
│   │   ├── services/                  # api.ts (Axios + Refresh Interceptor), socket.ts
│   │   ├── types/                     # Complete TypeScript interfaces
│   │   ├── App.tsx                    # Client route definitions
│   │   └── main.tsx                   # React root
│   ├── Dockerfile                     # Multi-stage build (Node builder -> Nginx runner)
│   ├── nginx.conf                     # Nginx SPA rewrite & gzip compression
│   ├── vercel.json                    # Vercel SPA rewrite configuration
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/                    # db.js (Atlas + pooling), env.js
│   │   ├── controllers/               # 11 Controllers (auth, user, group, expense, settlement, etc.)
│   │   ├── middleware/                # auth.js (JWT), groupAuth.js (Role-based access)
│   │   ├── models/                    # 9 Models (User, Group, Expense, Settlement, RefreshToken, etc.)
│   │   ├── routes/                    # 12 Express REST routers & health check
│   │   ├── services/                  # balanceService.js (Min-Cash-Flow Debt Simplification)
│   │   ├── sockets/                   # socketHandler.js (Authenticated room broadcasting)
│   │   ├── utils/                     # splitEngine.js, password.js, jwt.js, mailer.js, seed.js
│   │   ├── app.js                     # Express app instance, Helmet, CORS, logging, rate-limits
│   │   └── server.js                  # 0.0.0.0 binding, graceful shutdown, health check
│   ├── tests/
│   │   └── multiUserWorkflow.test.js  # 15 end-to-end integration test scenarios
│   ├── Dockerfile                     # Multi-stage Node 22-alpine container
│   ├── render.yaml                    # Render Blueprint configuration
│   └── package.json
│
├── docker-compose.yml                 # Local multi-container Docker Compose
├── docker-compose.prod.yml            # Production container configuration
├── .env.docker.example                # Docker environment configuration template
├── DEPLOYMENT.md                      # Comprehensive cloud deployment guide (Vercel, Render, Atlas)
├── package.json                       # Monorepo root scripts
└── README.md
```

---

## 🐳 Docker & Docker Compose Workflow

Expensely is fully containerized. You can run the entire full-stack ecosystem locally with a single command.

### 1. Quick Start with Docker Compose
```bash
# Clone the repository
git clone https://github.com/Ashutosh2245/Expensely.git
cd Expensely

# Setup Docker environment file
cp .env.docker.example .env.docker

# Build and start all containers in detached mode
docker compose up --build -d
```

### 2. Verify Running Containers
```bash
docker compose ps
```
Expected output:
| Name | Image | Status | Ports |
| :--- | :--- | :--- | :--- |
| `expensely-mongodb` | `mongo:7.0` | Up (healthy) | `0.0.0.0:27017->27017/tcp` |
| `expensely-backend` | `expensely-backend` | Up (healthy) | `0.0.0.0:5000->5000/tcp` |
| `expensely-frontend` | `expensely-frontend`| Up | `0.0.0.0:5173->80/tcp` |

Access the applications:
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Probe**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 3. Essential Docker CLI Commands
```bash
# View real-time logs for all services
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Seed the database with demo users and groups inside the container
docker compose exec backend npm run seed

# Run the backend test suite inside the container
docker compose exec backend npm test

# Restart services
docker compose restart

# Stop all containers
docker compose stop

# Stop and remove containers, networks, and keep persistent database volumes
docker compose down

# Stop and wipe everything including database volumes
docker compose down -v
```

---

## ☁️ Production Cloud Deployment

Expensely is configured for direct zero-downtime deployment on managed cloud platforms without self-managed virtual machines:

- **Frontend**: [Vercel](https://vercel.com/)
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - SPA Rewrites: Configured via `frontend/vercel.json`
- **Backend**: [Render](https://render.com/)
  - Persistent Web Service: `expensely-api`
  - Root directory: `backend`
  - Blueprint: `backend/render.yaml`
  - Health check path: `/api/health`
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com/)
  - Mongoose connection pooling with automated reconnection
- **Media Storage**: [Cloudinary](https://cloudinary.com/)
  - Direct cloud upload stream with public ID tracking

👉 **For the complete step-by-step cloud deployment walkthrough, environment variable tables, and smoke testing procedures, read [DEPLOYMENT.md](file:///C:/Users/Ashutosh%20Kumar/.gemini/antigravity/scratch/expense-splitter/DEPLOYMENT.md).**

---

## 🧪 Automated Testing

EXPENSELY includes a comprehensive test suite covering the entire multi-user collaborative scenario:
1. Register Ashutosh, Rahul, and Aman.
2. Ashutosh logs in and creates "Goa Trip 2026".
3. Ashutosh invites Rahul and Aman.
4. Rahul and Aman accept their invitations.
5. All three log in independently and confirm they see the **same** shared group ID.
6. Ashutosh logs a ₹1,500 expense (Equal split: ₹500 each).
7. Balances verified: Ashutosh +₹1,000, Rahul -₹500, Aman -₹500.
8. Rahul logs a ₹900 expense for watersports.
9. Balances updated: Ashutosh +₹700, Rahul +₹100, Aman -₹800.
10. Aman settles dues with Ashutosh (₹700) and Rahul (₹100).
11. Balances verified: All members squared to **₹0.00**!
12. Duplicate username (case-insensitive) rejection test.
13. Duplicate email rejection test.
14. Unauthorized group access rejection (403 Forbidden).
15. Invalid split sum validation test.

To execute tests:
```bash
# In backend directory
cd backend
npm test

# Or via Docker
docker compose exec backend npm test
```

---

## 📡 Health Check & System Monitoring

The backend exposes an unauthenticated health endpoint for cloud orchestrators (Render, Kubernetes, Docker):

`GET /api/health`

Response:
```json
{
  "status": "ok",
  "service": "expensely-api",
  "database": "connected",
  "timestamp": "2026-11-23T18:15:30.123Z"
}
```

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
