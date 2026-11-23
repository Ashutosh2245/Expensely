# 💳 EXPENSELY — Smart Expense Splitting & Collaborative SaaS Platform

<div align="center">

> *"Split Smart. Live Better."*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-expensely.vercel.app-00DC82?style=for-the-badge&logo=vercel&logoColor=white)](https://expensely-lovat.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A modern, production-grade fintech web application inspired by Splitwise. Engineered with integer-paise financial precision, real-time WebSocket synchronization, an optimal greedy Min-Cash-Flow debt simplification engine, and dark navy & emerald glassmorphism aesthetics.

</div>

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🏛️ System Architecture](#️-system-architecture)
- [📐 Financial Engineering & Math Invariants](#-financial-engineering--math-invariants)
- [🔄 Real-Time Collaboration & WebSockets](#-real-time-collaboration--websockets)
- [⚡ Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🐳 Docker & Quick Start](#-docker--quick-start)
- [☁️ Cloud Deployment Architecture](#️-cloud-deployment-architecture)
- [📡 API Health Monitoring](#-api-health-monitoring)
- [👨‍💻 Author & Developer](#-author--developer)

---

## ✨ Key Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             EXPENSELY PLATFORM                              │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│   SPLIT ENGINE      │     SETTLEMENTS     │       COLLABORATION & SYNC      │
│  • Equal Splits     │  • Min-Cash-Flow    │  • Room-based Socket.io         │
│  • Exact Amounts    │  • UPI / Cash / Net │  • Real-time Balance Updates    │
│  • Percentage Splits│  • Receipt Storage  │  • Multi-user Shared Groups     │
│  • 1-Paisa Rounding │  • Status Lifecycle │  • Dynamic Activity Logs        │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│    SECURITY & AUTH  │    CLOUD & DEVOPS   │       ANALYTICS & REPORTS       │
│  • Google OAuth 2.0 │  • 100% Zero-EC2    │  • Recharts Visual Trends       │
│  • Case-free User   │  • Vercel Edge SPA  │  • Monthly Expense Breakdowns   │
│  • Bcrypt + JWT     │  • Render Backend   │  • Client-side PDF Generation   │
│  • Helmet & Rate-Lim│  • Multi-stage OCI  │  • CSV Export Engine            │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

- **Zero Floating-Point Drift**: All currency is stored strictly in integer paise ($1\text{ INR} = 100\text{ paise}$).
- **Min-Cash-Flow Debt Simplification**: Transforms complex web-of-debt matrices with $N(N-1)$ transactions into at most $N-1$ optimal settlements.
- **Dual Authentication**: Secure Username/Password (bcrypt + JWT refresh token rotation) + Google OAuth 2.0.
- **Cloud Media Storage**: Direct stream uploads to Cloudinary for avatars and receipts.
- **Production-Ready Docker**: Optimized multi-stage Dockerfiles for frontend (Nginx Alpine) and backend (Node 22 Alpine, non-root).

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────┐
                                  │      Client Browser      │
                                  │   React 18 + Vite SPA    │
                                  └─────────────┬────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │ HTTPS (REST API)                     WSS (Socket.io)│
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │   Vercel Edge Network   │                           │  Render Web Service     │
        │   • Static SPA hosting  │                           │  • Express.js API       │
        │   • Global CDN cache    │                           │  • Socket.io Handshake  │
        │   • vercel.json rewrite │                           │  • Rate Limiting        │
        └─────────────────────────┘                           │  • Helmet & Security    │
                                                              └────────────┬────────────┘
                                                                           │
                                              ┌────────────────────────────┴───────────────────────────┐
                                              │                                                        │
                                              ▼                                                        ▼
                                 ┌─────────────────────────┐                              ┌─────────────────────────┐
                                 │   MongoDB Atlas (M0+)   │                              │   Cloudinary Storage    │
                                 │   • Mongoose 8.x        │                              │   • Bill Receipts       │
                                 │   • Connection Pooling  │                              │   • User Profile Avatars│
                                 │   • Integer Paise State │                              │   • Secure CDN URLs     │
                                 └─────────────────────────┘                              └─────────────────────────┘
```

---

## 📐 Financial Engineering & Math Invariants

### 1. Invariant: Group Net Zero Balance
In any valid financial state, the sum of all members' net balances in a group must strictly equal zero:

$$\sum_{i=1}^{M} \text{Balance}_i \equiv 0$$

### 2. Equal Splitting with 1-Paisa Remainder Preservation
When splitting an odd amount (e.g. ₹100.00 among 3 people = 10000 paise):
- Base share: $\lfloor 10000 / 3 \rfloor = 3333\text{ paise}$ (₹33.33)
- Remainder: $10000 \pmod 3 = 1\text{ paise}$ (₹0.01)
- The remainder is deterministically assigned to the first participant:
  $$\text{User}_1 = 3334\text{ paise},\quad \text{User}_2 = 3333\text{ paise},\quad \text{User}_3 = 3333\text{ paise}$$
  $$\text{Total} = 3334 + 3333 + 3333 = 10000\text{ paise (₹100.00 exact)}$$

### 3. Min-Cash-Flow Debt Simplification Algorithm
Transforms complex multi-party debts into minimum peer-to-peer transactions:

```
    WITHOUT SIMPLIFICATION (5 Transactions)          WITH MIN-CASH-FLOW (2 Transactions)
           
              [User A]                                           [User A]
             /        \                                              │
         ₹400          ₹300                                          │ ₹700
           ▼              ▼                                          ▼
       [User B] ────► [User C]                                   [User C]
           │    ₹100      ▲                                          ▲
           │              │                                          │ ₹100
           └────► [User D]┘                                      [User B]
                  ₹200
```

---

## 🔄 Real-Time Collaboration & WebSockets

Clients establish authenticated WebSocket connections and join group-specific rooms (`group:<groupId>`):

```
User A (Adds Expense)              Backend Server                   User B (Connected Peer)
        │                                │                                    │
        ├─── POST /api/expenses ────────►│                                    │
        │    (Amount, Splits, Group)     ├── 1. Validate integer splits       │
        │                                ├── 2. Save to MongoDB Atlas         │
        │                                ├── 3. Recompute member balances     │
        │                                │                                    │
        │◄── 201 Created (Expense) ──────┤                                    │
        │                                ├─── Emit 'expense:created' ────────►│
        │                                ├─── Emit 'balance:updated' ────────►│ (UI updates instantly)
        │                                │                                    │
```

---

## ⚡ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, Framer Motion, Lucide React, Recharts, Axios, Socket.io Client, jsPDF |
| **Backend** | Node.js 22, Express.js 4, Socket.io 4, Helmet 8, CORS, Express-Rate-Limit, Zod, Nodemailer, Multer |
| **Database** | MongoDB Atlas (Cloud Replica Set), Mongoose 8 (`minPoolSize: 2`, `maxPoolSize: 10`) |
| **Media CDN** | Cloudinary (Direct-to-cloud streams for avatars and bill receipts) |
| **Hosting** | Vercel (Frontend SPA) + Render (Persistent Node.js Backend Service) |
| **Containers** | Docker, Docker Compose, Nginx Alpine, Multi-stage builds |
| **CI / CD** | GitHub Actions (`ci.yml`, `docker-ci.yml`) |

---

## 📁 Project Structure

```text
Expensely/
├── .github/workflows/
│   ├── ci.yml                 # Node 22 test runner & Vite compilation
│   └── docker-ci.yml          # Docker Buildx multi-stage build validation
│
├── frontend/
│   ├── src/
│   │   ├── components/        # StatCard, Modal, Navbar, Sidebar, Skeleton, EmptyState
│   │   ├── context/           # AuthContext, NotificationContext
│   │   ├── layouts/           # AppLayout (with developer credit footer)
│   │   ├── pages/             # 17 Pages (Landing, Dashboard, Groups, AddExpense, etc.)
│   │   ├── services/          # api.ts (Axios + auto-refresh), socket.ts
│   │   ├── types/             # Full TypeScript interfaces
│   │   └── App.tsx            # Route tree
│   ├── Dockerfile             # Multi-stage (Node builder -> Nginx runner)
│   ├── nginx.conf             # Nginx SPA rewrite & gzip compression
│   └── vercel.json            # Vercel SPA routing
│
├── backend/
│   ├── src/
│   │   ├── config/            # db.js (Atlas pooling), env.js
│   │   ├── controllers/       # Auth, Group, Expense, Settlement, Analytics
│   │   ├── middleware/        # auth.js (JWT), groupAuth.js (Role-based)
│   │   ├── models/            # User, Group, Expense, Settlement, Notification, etc.
│   │   ├── routes/            # REST API routes & health check
│   │   ├── services/          # balanceService.js (Min-Cash-Flow algorithm)
│   │   ├── sockets/           # socketHandler.js (Authenticated room broadcasting)
│   │   └── server.js          # 0.0.0.0 binding, graceful shutdown, health probe
│   ├── tests/                 # End-to-end multi-user integration test suites
│   ├── Dockerfile             # Multi-stage Node 22 Alpine (non-root security)
│   └── render.yaml            # Render Blueprint deployment configuration
│
├── docker-compose.yml         # Local development compose
├── docker-compose.prod.yml    # Production container compose
├── DEPLOYMENT.md              # Complete cloud deployment manual (Sections A-L)
└── README.md
```

---

## 🐳 Docker & Quick Start

### 1. Run Everything via Docker Compose
```bash
# Clone the repository
git clone https://github.com/Ashutosh2245/Expensely.git
cd Expensely

# Configure environment
cp .env.docker.example .env.docker

# Start containers in detached mode
docker compose up --build -d
```

Services will be available at:
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### 2. Standard Local Development
```bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (in a new terminal)
cd frontend
npm install
npm run dev
```

---

## ☁️ Cloud Deployment Architecture

The application is deployed on 100% managed infrastructure:

- **Frontend (Vercel)**:
  - Framework: `Vite` | Root: `frontend`
  - Build: `npm run build` | Output: `dist`
  - SPA Rewrites configured via `frontend/vercel.json`
- **Backend (Render)**:
  - Runtime: `Node` | Root: `backend`
  - Persistent Web Service (supports WebSocket upgrades)
  - Blueprint configured via `backend/render.yaml`
- **Database (MongoDB Atlas)**:
  - Persistent cloud cluster with automated replica set failover
  - Network access whitelisted for cloud providers (`0.0.0.0/0`)
- **Storage (Cloudinary)**:
  - Media receipts and profile avatars stored with secure CDN delivery

👉 **For complete click-by-click instructions, refer to [DEPLOYMENT.md](DEPLOYMENT.md).**

---

## 📡 API Health Monitoring

Render and uptime monitors probe the unauthenticated health endpoint:

`GET /api/health`

```json
{
  "status": "ok",
  "service": "expensely-api",
  "database": "connected",
  "timestamp": "2026-11-23T18:30:00.000Z"
}
```

---

## 👨‍💻 Author & Developer

<div align="center">

Developed with ❤️ by **[Ashutosh Kumar](https://www.linkedin.com/in/ashutosh-kumar-92612b236/)**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ashutosh%20Kumar-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ashutosh-kumar-92612b236/)
[![GitHub](https://img.shields.io/badge/GitHub-Ashutosh2245-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ashutosh2245)

</div>

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
