# 🚀 FlexPass - Micro-Services Marketplace

FlexPass is a robust, "pay-per-use" marketplace platform that democratizes access to premium digital tools and APIs. Instead of locked-in monthly subscriptions, users purchase flexible Time Passes or Usage Credits using a unified wallet system.

![FlexPass Hero](https://via.placeholder.com/800x400?text=FlexPass+Dashboard+Preview)

## 🌟 Key Features

### 🛒 Core Marketplace
- **Unified Catalog**: Browse a variety of micro-services (AI Tools, Data APIs, Creative Assets).
- **Flexible Access Models**:
  - **Time Pass**: Unlock unlimited access for 24 hours.
  - **Usage Pass**: Purchase specific unit credits (e.g., 100 API Calls).
- **Smart Wallet**: Centralized funding source for all purchases.
- **Mock Payments**: Integrated simulation for Razorpay transactions.

### ⚡ Performance & Security
- **Redis Acceleration**:
  - **Caching**: Instantaneous serving of marketplace listings and user profiles.
  - **Distributed Locks**: Prevents race conditions and double-spending.
  - **Rate Limiting**: Protects sensitive endpoints (OTP, Auth).
- **Secure Authentication**:
  - JWT-based Session Management.
  - **Google OAuth 2.0**: One-click login/signup.
  - **Email OTP**: Secure passwordless verification via Nodemailer.

### 🎁 Rewards & Engagement
- **Cashback Engine**: Automated 5% "Standard Cashback" on every purchase.
- **Double-Sided Referrals**:
  - **Referrer**: Earns ₹5 for every successful invite.
  - **Referee**: Gets ₹2.5 starter bonus after first purchase.
- **Gamification**: Visual wallet tracking, history badges, and email receipts.

### 🛡️ Admin & Support
- **Live Admin Dashboard**: Real-time revenue charts, active user tracking, and system health monitoring.
- **Service Management**: CRUD operations for marketplace offerings.
- **Security Panel**: Monitor active API locks and potential threats.
- **Live Support**: Integrated real-time chat (Socket.io) for instant customer assistance.

---

## 🛠 Tech Stack

### Frontend
- **React.js (Vite)**: Fast, modern UI framework.
- **Tailwind CSS**: Utility-first styling for a premium "Glassmorphism" look.
- **Framer Motion**: Smooth animations and page transitions.
- **Lucide React**: Beautiful, consistent iconography.
- **Axios**: Optimized HTTP client with interceptors.

### Backend
- **Node.js & Express**: Robust REST API architecture.
- **MongoDB (Mongoose)**: Scalable NoSQL database.
- **Redis (Upstash)**: High-performance caching and messaging.
- **Socket.io**: Real-time bidirectional communication.
- **Nodemailer**: Transactional email delivery.
- **Bcrypt & JWT**: Industry-standard security.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB URI
- Redis (Upstash) URL & Token
- Google OAuth Credentials

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/flexpass.git
cd flexpass
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in `/server` based on the example below:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Google Auth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@flexpass.com
```

Start the Development Server:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 3. Client Setup
Open a new terminal, navigate to the client directory:
```bash
cd client
npm install
```

Start the React App:
```bash
npm run dev
# Client running on http://localhost:5173
```

---

## 📂 Project Structure

```text
flexpass/
├── client/                 # Frontend React App
│   ├── src/
│   │   ├── components/     # Reusable UI (Navbar, Modals)
│   │   ├── context/        # Global State (AuthContext)
│   │   ├── pages/          # Auth, Dashboard, Marketplace, Admin
│   │   └── api.js          # Centralized Axios Instance
│   └── vite.config.js
│
├── server/                 # Backend Node API
│   ├── config/             # DB & Redis Config
│   ├── middleware/         # Auth & Rate Limiters
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Routes (Auth, Service, Pass)
│   └── services/           # RedisService, EmailService
│
└── README.md
```

---

## 🔒 Security Measures

1.  **Distributed Locking**: Critical wallet operations (`/buy`, `/withdraw`) are wrapped in Redis locks to ensure ACID-like compliance in a distributed environment.
2.  **Input Sanitation**: All API inputs are validated; MongoDB injection protection is inherent in Mongoose.
3.  **Role-Based Access**: Middleware strictly separates `User` and `Admin` routes.

---

## 📄 License
This project is licensed under the MIT License.
