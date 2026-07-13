import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Book Appointment Endpoint
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, problem, preferredDate, preferredTime } = req.body;

    console.log('Received appointment request:', { name, email, mobile, problem, preferredDate, preferredTime });

    // Validate input
    if (!name || !email || !mobile || !problem || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // Format date
    const formattedDate = new Date(preferredDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMobile = escapeHtml(mobile);
    const safeProblem = escapeHtml(problem);
    const safePreferredTime = escapeHtml(preferredTime);

    // 1. Email to Clinic (Admin)
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 8px; }
          .field { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
          .label { font-weight: bold; color: #2c3e50; }
          .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
          .badge { display: inline-block; background: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 New Appointment Request</h2>
            <span class="badge">Website Inquiry</span>
          </div>
          <div class="content">
            <h3>Patient Details:</h3>
            <div class="field">
              <div class="label">👤 Name:</div>
              <div>${safeName}</div>
            </div>
            <div class="field">
              <div class="label">✉️ Email:</div>
              <div>${safeEmail}</div>
            </div>
            <div class="field">
              <div class="label">📱 Mobile:</div>
              <div>${safeMobile}</div>
            </div>
            <div class="field">
              <div class="label">🩺 Problem:</div>
              <div>${safeProblem}</div>
            </div>
            <div class="field">
              <div class="label">📅 Preferred Date:</div>
              <div>${formattedDate}</div>
            </div>
            <div class="field">
              <div class="label">🕐 Preferred Time:</div>
              <div>${safePreferredTime}</div>
            </div>
            <div class="field">
              <div class="label">📍 Source:</div>
              <div>Website Appointment Form</div>
            </div>
            <div class="field">
              <div class="label">🏥 Center:</div>
              <div>Dr. Jadhavar Physiotherapy & Rehabilitation Center</div>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from your website.</p>
            <p>Please contact the patient to confirm the appointment.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Dr. Jadhavar Physiotherapy" <${process.env.SMTP_USER}>`,
      to: 'drpratibhajadhavar@gmail.com',
      replyTo: email,
      subject: `New Appointment Request - ${name}`,
      html: adminEmailHtml,
    });

    // 2. Auto-reply to Patient
    const patientEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 8px; }
          .field { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
          .label { font-weight: bold; color: #2c3e50; }
          .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Appointment Request Received</h2>
          </div>
          <div class="content">
            <p>Dear ${safeName},</p>
            <p>Thank you for contacting Dr. Jadhavar Physiotherapy & Rehabilitation Center. We have received your appointment request.</p>
            <div class="field">
              <div class="label">Preferred Date:</div>
              <div>${formattedDate}</div>
            </div>
            <div class="field">
              <div class="label">Preferred Time:</div>
              <div>${safePreferredTime}</div>
            </div>
            <p>Our team will contact you shortly to confirm the appointment.</p>
          </div>
          <div class="footer">
            <p>Dr. Jadhavar Physiotherapy & Rehabilitation Center</p>
            <p>This is an automated reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Dr. Jadhavar Physiotherapy" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Appointment Request Received - Dr. Jadhavar Physiotherapy',
      html: patientEmailHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: {
        name,
        email,
        mobile,
        problem,
        preferredDate: formattedDate,
        preferredTime
      }
    });

  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
});

export default router;
