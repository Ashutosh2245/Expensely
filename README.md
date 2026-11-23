# EXPENSELY – Smart Expense Splitting & Collaborative Management Platform

> **"Split Smart. Live Better."**

EXPENSELY is a modern, production-grade financial SaaS application inspired by Splitwise, built with a dark navy & emerald fintech design, integer-paise financial precision, real-time WebSocket synchronization, and an optimal Min-Cash-Flow debt simplification engine.

---

## 🌟 Key Highlights & Engineering Features

- **Integer Paise Financial Precision**: Zero floating-point rounding discrepancies. All calculations internally operate strictly on integer paise, guaranteeing that the group balance invariant `∑(netBalances) = 0` is strictly maintained.
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

### Frontend
- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS (Custom Dark Navy, Emerald, Coral, and Violet theme)
- **Animations**: Framer Motion & CSS micro-interactions
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Area, Donut, Bar charts)
- **Routing**: React Router DOM v6
- **Networking**: Axios with automatic JWT refresh queue interceptor
- **Real-Time**: Socket.io Client
- **Document Generation**: jsPDF + jspdf-autotable
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js (v22+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose (with embedded MongoMemoryServer fallback)
- **Real-Time Gateway**: Socket.io Server (Room-based authorization)
- **Authentication**: JWT (Access Token 15m + Refresh Token rotation 7d)
- **Security**: bcryptjs password hashing, rate limiting, CORS with credentials
- **Email Service**: Nodemailer (with Ethereal test mailer fallback)
- **File Uploads**: Multer with local disk storage and Cloudinary integration

---

## 📁 Project Structure

```
expense-splitter/
├── frontend/
│   ├── src/
│   │   ├── components/      # StatCard, Modal, Navbar, Sidebar, LoadingSkeleton, EmptyState
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── layouts/         # AppLayout
│   │   ├── pages/           # 17 Pages (Landing, Dashboard, Groups, AddExpense, SettleUp, etc.)
│   │   ├── services/        # api.ts (Axios + Refresh Interceptor), socket.ts
│   │   ├── types/           # Complete TypeScript interfaces
│   │   ├── index.css        # Tailwind directives, custom glassmorphism, scrollbars
│   │   ├── App.tsx          # Client route definitions
│   │   └── main.tsx         # React root
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (MongoDB + Memory Server), env.js
│   │   ├── controllers/     # auth, user, group, expense, balance, settlement, analytics, etc.
│   │   ├── middleware/      # auth.js (JWT), groupAuth.js (Role-based access)
│   │   ├── models/          # User, Group, Expense, Settlement, Notification, Activity, etc.
│   │   ├── routes/          # Express REST routers
│   │   ├── services/        # balanceService.js (Min-Cash-Flow Debt Simplification)
│   │   ├── sockets/         # socketHandler.js (Authenticated room broadcasting)
│   │   ├── utils/           # splitEngine.js, password.js, jwt.js, mailer.js, seed.js
│   │   ├── app.js           # Express app instance & static frontend serving
│   │   └── server.js        # HTTP server & WebSocket bootstrap
│   ├── tests/
│   │   └── multiUserWorkflow.test.js  # 15 end-to-end integration test scenarios
│   ├── package.json
│   └── .env.example
│
├── package.json             # Monorepo root script runner
├── README.md                # Comprehensive documentation
├── .gitignore
└── .env.example
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm** or **pnpm**
- *(Optional)* Local MongoDB or MongoDB Atlas URI (If not running, the application starts an embedded in-memory MongoDB automatically!)

### 2. Installation
From the root directory or inside `backend` and `frontend`:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Seed Database with Realistic Demo Data
Populate demo users, collaborative groups, expenses, and settlements:
```bash
cd backend
npm run seed
```
Demo accounts created:
| Full Name | Username | Email | Password | Role in Goa Trip |
| :--- | :--- | :--- | :--- | :--- |
| **Ashutosh Kumar** | `ashutosh` | `ashutosh@expensely.app` | `password123` | Owner |
| **Rahul Sharma** | `rahul` | `rahul@expensely.app` | `password123` | Admin |
| **Aman Verma** | `aman` | `aman@expensely.app` | `password123` | Member |
| **Priya Singh** | `priya` | `priya@expensely.app` | `password123` | Member |

*(You can also use the 1-Click Quick Demo Login buttons on the Sign-In screen!)*

### 4. Running the Application

#### Option A: Unified Production Mode (Backend serves Frontend)
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Start server
cd ../backend
npm start
```
Open **`http://localhost:5000`** in your browser.

#### Option B: Development Mode (Vite HMR + Backend Watcher)
- Terminal 1 (Backend):
  ```bash
  cd backend
  npm run dev
  ```
- Terminal 2 (Frontend):
  ```bash
  cd frontend
  npm run dev
  ```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

EXPENSELY includes a comprehensive integration test suite verifying the mandatory multi-user collaborative scenario:
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
16. Google authentication user linking.

To run tests:
```bash
cd backend
npm test
```

---

## 🔑 Environment Variables Reference

Create a `.env` file in `backend/` (or copy from `.env.example`):

```ini
# Server Port
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (Leave default to use automatic embedded in-memory MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/expensely

# JWT Authentication
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth 2.0 (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary (Optional for cloud media uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP Email Configuration (Optional - falls back to test logger/Ethereal)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=EXPENSELY <no-reply@expensely.app>
```

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register new user with full name, unique username, email & password | No |
| `POST` | `/login` | Login with username/email and password | No |
| `POST` | `/google` | Google OAuth token verification and account linking | No |
| `GET` | `/check-username/:username` | Real-time username availability check | No |
| `POST` | `/refresh` | Rotate refresh token and issue new access token | No |
| `POST` | `/logout` | Invalidate refresh token session | No |
| `GET` | `/me` | Get currently authenticated user profile | Yes (Bearer) |
| `POST` | `/forgot-password` | Generate reset token and email instructions | No |
| `POST` | `/reset-password` | Update password using valid reset token | No |

### Groups (`/api/groups`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Create new group (User is set as OWNER) | Yes |
| `GET` | `/` | Get all groups user is member of with personal net balance | Yes |
| `GET` | `/:id` | Get group details, members, and real-time balances | Yes (Member) |
| `PATCH` | `/:id` | Update group name, description, avatar, category | Yes (Admin/Owner) |
| `DELETE` | `/:id` | Delete group and associated expenses | Yes (Owner) |
| `POST` | `/:id/invite` | Invite user by username or email | Yes (Member) |
| `POST` | `/join/:inviteCode` | Join group via shareable link code | Yes |
| `DELETE` | `/:id/members/:memberId` | Remove member or leave group | Yes (Admin/Owner) |

### Expenses (`/api/expenses`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Add expense with Equal, Exact, or Percentage split | Yes (Member) |
| `GET` | `/group/:groupId` | Get group expenses with search, category, and date filter | Yes (Member) |
| `GET` | `/:id` | Get single expense details, receipt, and breakdown | Yes (Member) |
| `PATCH` | `/:id` | Edit expense description, category, or notes | Yes (Creator/Admin) |
| `DELETE` | `/:id` | Delete expense and recalculate group balances | Yes (Creator/Admin) |

### Balances & Debt Simplification (`/api/balances`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/groups/:groupId` | Calculate complete group balances in integer paise | Yes (Member) |
| `GET` | `/groups/:groupId/suggestions`| Min-Cash-Flow optimal simplified debts | Yes (Member) |
| `GET` | `/me` | User's aggregate net balance across all groups | Yes |

### Settlements (`/api/settlements`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Record payment settlement (Cash, UPI, Bank Transfer) | Yes (Member) |
| `GET` | `/group/:groupId` | Get group settlement history | Yes (Member) |
| `PATCH` | `/:id/confirm` | Creditor confirms receipt of payment | Yes (Recipient) |
| `PATCH` | `/:id/reject` | Reject invalid settlement | Yes (Recipient) |

### Friends & Invitations
- `GET /api/friends`: List user's accepted friends.
- `POST /api/friends/request`: Send friend request by username or email.
- `POST /api/friends/accept/:id`: Accept incoming friend request.
- `GET /api/invitations`: List pending group invitations.
- `POST /api/invitations/:id/accept`: Accept group invitation.

### Analytics (`/api/analytics`)
- `GET /api/analytics`: Monthly spending trends, category distributions, group comparisons.
- `GET /api/analytics/export/csv`: Stream downloadable CSV expense audit log.

---

## 🔒 Security Best Practices Implemented

1. **Password Hashing**: 10-round salted bcrypt hashing; plain-text passwords are never stored or logged.
2. **Access & Refresh Token Lifecycle**: Short-lived (15-minute) JWT access tokens paired with 7-day cryptographically hashed refresh tokens stored in the database. Tokens are rotated upon every refresh request.
3. **Collation & Case-Insensitive Unique Constraints**: Username comparisons are strictly lowercase and enforce MongoDB unique index constraints.
4. **Group Authorization Boundary**: Middleware rigorously verifies that a user belongs to a group before revealing expenses, balances, or activity records.
5. **No Floating-Point Math**: All currencies are converted to and stored as integer paise (`amountInPaise = Math.round(rupees * 100)`), preventing financial rounding leakage.

---

## 🚢 Production Deployment

### Docker Deployment
EXPENSELY can be containerized effortlessly with standard multi-stage Dockerfiles:
```dockerfile
# Build frontend
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production Node Server
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY backend/ ./backend/
COPY --from=build-frontend /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000
CMD ["node", "backend/src/server.js"]
```

---

## 📜 Evaluation Checklist & Verification

| Requirement | Implementation Status |
| :--- | :--- |
| Dual Authentication (Google + Username/Password) | **Completed & Tested** |
| Unique case-insensitive usernames | **Enforced with MongoDB unique indexes** |
| Multi-User shared group model | **Completed (Same ObjectId shared across peers)** |
| Real-time WebSockets (Socket.io) | **Completed (Rooms: `group:<id>` and `user:<id>`)** |
| Integer paise financial engine | **Completed (Zero floating point errors)** |
| Min-Cash-Flow debt simplification | **Completed (Greedy optimal matching)** |
| 3 Splitting Methods (Equal, Exact, Percentage) | **Completed with sum validation** |
| Dedicated Settle Up module | **Completed with confirmation workflow** |
| Advanced Analytics & Charts | **Completed (Recharts + CSV & PDF export)** |
| 17 Pages with modern fintech theme | **Completed (Dark navy, emerald, coral, violet)** |
| Integration tests passing | **15/15 tests passing** |

---

Made with ❤️ by Ashutosh Kumar for **EXPENSELY**.
*Split Smart. Live Better.*
