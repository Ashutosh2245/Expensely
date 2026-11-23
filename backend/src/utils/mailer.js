import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (config.SMTP_USER && config.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  } else {
    // Development fallback using Ethereal test account or dummy logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[Mailer] Using Ethereal test mailer account:', testAccount.user);
    } catch (e) {
      console.warn('[Mailer] Could not create Ethereal account, falling back to mock mailer');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('[Mock Mailer] Sending email:', mailOptions.to, mailOptions.subject);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: config.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html: html || `<p>${text}</p>`
    });

    if (nodemailer.getTestMessageUrl && info) {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log(`[Mailer] Preview URL for email to ${to}: ${preview}`);
      }
    }
    return info;
  } catch (err) {
    console.error(`[Mailer] Failed to send email to ${to}:`, err.message);
    return null;
  }
}
