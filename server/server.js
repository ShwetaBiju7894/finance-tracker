const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const billReminderJob = require('./jobs/billReminder');

// Load environment variables from .env file
dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json()); // lets Express read JSON from request body

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/categories',   require('./routes/categoryRoutes'));
app.use('/api/goals',        require('./routes/goalRoutes'));
app.use('/api/bills',        require('./routes/billRoutes'));
app.use('/api/insights',     require('./routes/insightRoutes'));
app.use('/api/analytics',    require('./routes/analyticsRoutes'));

// ─── Health check ─────────────────────────────────────────────────────────────
// Visit http://localhost:5000/api/health to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// ─── Global error handler (always last) ───────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();      // connect to PostgreSQL first
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    billReminderJob.start(); // start the daily bill reminder scheduler
  });
};

start();