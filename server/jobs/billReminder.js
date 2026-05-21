const cron = require('node-cron');
const { pool } = require('../config/db');
const { sendBillReminder } = require('../services/emailService');

// Runs every day at 8:00 AM
const start = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('Running bill reminder job...');

    try {
      // Get all bills where email reminders are on
      const { rows: bills } = await pool.query(`
        SELECT
          b.id, b.name, b.amount, b.due_date, b.remind_days,
          u.email, u.name AS user_name
        FROM bills b
        JOIN users u ON b.user_id = u.id
        WHERE b.email_remind = true
      `);

      const today = new Date().getDate();

      for (const bill of bills) {
        const daysUntilDue = bill.due_date - today;

        // Send reminder if within the remind window
        if (daysUntilDue === bill.remind_days || daysUntilDue === 1) {
          try {
            await sendBillReminder({
              to:          bill.email,
              name:        bill.user_name,
              billName:    bill.name,
              amount:      bill.amount,
              daysUntilDue,
            });
            console.log(`Reminder sent to ${bill.email} for bill: ${bill.name}`);
          } catch (emailError) {
            console.error(`Failed to send reminder for bill ${bill.name}:`, emailError.message);
          }
        }
      }

    } catch (error) {
      console.error('Bill reminder job failed:', error.message);
    }
  });

  console.log('Bill reminder job started — runs daily at 8:00 AM');
};

module.exports = { start };