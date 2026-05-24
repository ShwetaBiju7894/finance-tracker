# Finsight — Personal Finance Tracker

A full stack personal finance web application with AI-powered spending insights, goal tracking, bill reminders, and visual analytics.

![Dashboard Preview](https://via.placeholder.com/1200x600/185FA5/ffffff?text=Finsight+Dashboard)

## 🌐 Live Demo

🔗 **Live Demo:** https://finsight-nu-coral.vercel.app

---

## ✨ Features

- **Dashboard** — Real-time overview of income, expenses, savings, and upcoming bills
- **Transactions** — Full CRUD with search, category filters, and monthly summaries
- **Goals** — Savings goal tracking with progress bars and contribution history
- **Bills** — Recurring bill tracker with automated email reminders via node-cron
- **Analytics** — Visual charts including income vs expenses, spending by category, savings trends, and top spending days
- **AI Insights** — Gemini-powered spending analysis with personalized tips, monthly summaries, and budget advice
- **Settings** — Profile management, password change, and account info
- **Authentication** — JWT-based auth with bcrypt password hashing
- **Responsive** — Works on desktop and mobile

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI framework |
| React Router DOM | Client-side routing |
| Recharts | Data visualization |
| Axios | HTTP client |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| bcryptjs | Password hashing |
| JSON Web Tokens | Authentication |
| Nodemailer | Email reminders |
| node-cron | Scheduled jobs |
| Google Gemini API | AI spending insights |

---

## 📁 Project Structure

```
finance-tracker/
├── client/                   # React frontend
│   └── src/
│       ├── api/              # Axios instance with interceptors
│       ├── components/       # Reusable UI + layout components
│       ├── context/          # Auth context
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # All 8 pages
│       └── utils/            # Formatters and helpers
│
└── server/                   # Node.js backend
    ├── config/               # Database connection pool
    ├── controllers/          # Business logic
    ├── db/                   # SQL schema
    ├── jobs/                 # Scheduled bill reminders
    ├── middleware/           # Auth + error handling
    ├── routes/               # API endpoints
    └── services/             # Email + AI services
```

---

## 🗄️ Database Schema

```sql
users         → id, name, email, password, created_at
categories    → id, user_id, name, color, icon, type
transactions  → id, user_id, category_id, type, amount, note, date
goals         → id, user_id, title, target_amount, current_amount, deadline
bills         → id, user_id, name, amount, due_date, is_recurring, remind_days, email_remind
```

---

## 🔌 REST API Endpoints

```
Auth
POST   /api/auth/register          Register new account
POST   /api/auth/login             Login
GET    /api/auth/me                Get current user
PUT    /api/auth/profile           Update profile
PUT    /api/auth/password          Change password

Transactions
GET    /api/transactions           Get all (with filters)
POST   /api/transactions           Create new
PUT    /api/transactions/:id       Update
DELETE /api/transactions/:id       Delete
GET    /api/transactions/summary   Monthly totals

Categories
GET    /api/categories             Get all
POST   /api/categories             Create
PUT    /api/categories/:id         Update
DELETE /api/categories/:id         Delete

Goals
GET    /api/goals                  Get all
POST   /api/goals                  Create
PUT    /api/goals/:id              Update
PATCH  /api/goals/:id/contribute   Add contribution
DELETE /api/goals/:id              Delete

Bills
GET    /api/bills                  Get all
POST   /api/bills                  Create
PUT    /api/bills/:id              Update
DELETE /api/bills/:id              Delete

Analytics
GET    /api/analytics/monthly      Last 6 months overview
GET    /api/analytics/categories   Spending by category
GET    /api/analytics/daily        Daily spending
GET    /api/analytics/comparison   Month vs month
GET    /api/analytics/top-days     Average spending by day

AI Insights
POST   /api/insights/analyze       AI spending analysis
GET    /api/insights/monthly-summary  AI monthly summary
GET    /api/insights/budget-advice    AI budget recommendations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 15+
- Google Gemini API key (free at aistudio.google.com)
- Gmail account (for email reminders)

### 1. Clone the repository

```bash
git clone https://github.com/ShwetaBiju7894/finance-tracker.git
cd finance-tracker
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the server folder:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Create the database and tables:

```bash
# Create database in PostgreSQL first, then:
psql -U postgres -d finance_tracker -f db/schema.sql
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd ../client
npm install
npm start
```

### 4. Open the app

Visit `http://localhost:3000` and create your account.

---

## 🤖 AI Features

The app uses **Google Gemini** to analyze your financial data and provide:

- **Spending insights** — Identifies patterns and gives specific actionable tips
- **Monthly summary** — Plain-English overview comparing this month to last
- **Budget advice** — Personalized 50/30/20 budget recommendations

All AI features use your actual transaction data — insights are specific to you, not generic advice.

---

## 📧 Email Reminders

The app runs a scheduled job every day at 8:00 AM that checks for upcoming bills and sends email reminders based on your configured reminder window (1, 3, 5, or 7 days before due date).

---

## 👤 Author

Built by **[Shweta Biju Thomas]** as a portfolio project demonstrating full stack development with React, Node.js, PostgreSQL, REST APIs, and AI integration.

- GitHub: https://github.com/ShwetaBiju7894
- LinkedIn: https://linkedin.com/in/shweta-biju-thomas

---

## 📄 License

MIT License — feel free to use this project as inspiration for your own.
