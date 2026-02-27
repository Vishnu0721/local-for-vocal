const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const tx = getTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';

  await tx.sendMail({
    from,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
};

