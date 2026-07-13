import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Book Appointment Endpoint
router.post('/appointment', async (req, res) => {
  try {
    const { name, mobile, problem, preferredDate, preferredTime } = req.body;

    // Validate input
    if (!name || !mobile || !problem || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
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
              <div>${name}</div>
            </div>
            <div class="field">
              <div class="label">📱 Mobile:</div>
              <div>${mobile}</div>
            </div>
            <div class="field">
              <div class="label">🩺 Problem:</div>
              <div>${problem}</div>
            </div>
            <div class="field">
              <div class="label">📅 Preferred Date:</div>
              <div>${formattedDate}</div>
            </div>
            <div class="field">
              <div class="label">🕐 Preferred Time:</div>
              <div>${preferredTime}</div>
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
      subject: `📋 New Appointment Request - ${name}`,
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
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 8px; }
          .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .detail-item { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
          .whatsapp-btn { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; margin-top: 20px; }
          .highlight { color: #27ae60; font-weight: bold; }
          .working-hours { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .working-hours strong { color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Appointment Request Received!</h2>
          </div>
          <div class="content">
            <h3>Dear ${name},</h3>
            <p>Thank you for booking an appointment with <strong>Dr. Jadhavar Physiotherapy & Rehabilitation Center</strong>. 🏥</p>
            
            <p>We have received your appointment request for:</p>
            <div class="details">
              <div class="detail-item">📅 <strong>Date:</strong> ${formattedDate}</div>
              <div class="detail-item">🕐 <strong>Time:</strong> ${preferredTime}</div>
            </div>

            <p>Our team will confirm your appointment shortly via WhatsApp or call.</p>

            <div class="working-hours">
              <strong>🕐 Working Hours:</strong><br>
              Monday - Saturday: 9:00 AM - 8:00 PM<br>
              Sunday: Closed
            </div>

            <p><strong>💡 What to bring:</strong></p>
            <ul>
              <li>Any previous medical reports</li>
              <li>Prescriptions (if any)</li>
              <li>Comfortable clothing for examination</li>
            </ul>

            <p><strong>📍 Location:</strong> Dr. Jadhavar Physiotherapy & Rehabilitation Center</p>

            <p>For urgent queries, call us at: <strong>+91 77009 95363</strong></p>

            <a href="https://wa.me/917700995363" class="whatsapp-btn">💬 Contact us on WhatsApp</a>

            <p style="margin-top: 25px; color: #27ae60; font-size: 16px;">
              <strong>We look forward to helping you recover and move better! 💪</strong>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation. Please keep this email for your reference.</p>
            <p>© ${new Date().getFullYear()} Dr. Jadhavar Physiotherapy & Rehabilitation Center</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Dr. Jadhavar Physiotherapy" <${process.env.SMTP_USER}>`,
      to: `${mobile}@sms.airtel.in`, // This is a workaround - user should provide email
      subject: '✅ Appointment Confirmation - Dr. Jadhavar Physiotherapy',
      html: patientEmailHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: {
        name,
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