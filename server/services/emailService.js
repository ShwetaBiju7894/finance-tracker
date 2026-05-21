const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── SEND BILL REMINDER ───────────────────────────────────────────────────────
const sendBillReminder = async ({ to, name, billName, amount, daysUntilDue }) => {
  const subject = `Reminder: ${billName} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #185FA5; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">💳 Bill Reminder</h1>
      </div>
      <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #333; font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #555;">This is a reminder that your bill is coming up soon:</p>
        <div style="background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #333;"><strong>Bill:</strong> ${billName}</p>
          <p style="margin: 4px 0; color: #333;"><strong>Amount:</strong> $${amount}</p>
          <p style="margin: 4px 0; color: #E24B4A;"><strong>Due in:</strong> ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}</p>
        </div>
        <p style="color: #555; font-size: 14px;">Log in to Finsight to manage your bills.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          You are receiving this because you enabled bill reminders in Finsight.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    `"Finsight" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendBillReminder };