import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

import authRoutes from './routes/authRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
// import noticeRoutes from './routes/noticeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5031;

// ===============================
// CORS Configuration
// ===============================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://drjadhavarphysiotherapy.com',
    'https://www.drjadhavarphysiotherapy.com',
    'https://drjadhvarphysiotherapy.netlify.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Nodemailer Configuration
// ===============================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email service configured successfully');
  }
});

// ===============================
// Appointment Routes
// ===============================
app.post('/api/appointments', async (req, res) => {
  try {
    const { name, mobile, problem, preferredDate, preferredTime } = req.body;

    // Validate input
    if (!name || !mobile || !problem || !preferredDate || !preferredTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number'
      });
    }

    // Format date
    const formattedDate = new Date(preferredDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // ===============================
    // Email 1: Send to Admin (drpratibhajadhavar@gmail.com)
    // ===============================
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📋 New Appointment Request
        </h2>
        
        <div style="margin: 20px 0;">
          <p><strong>👤 Name:</strong> ${name}</p>
          <p><strong>📱 Mobile:</strong> ${mobile}</p>
          <p><strong>🩺 Problem:</strong> ${problem}</p>
          <p><strong>📅 Preferred Date:</strong> ${formattedDate}</p>
          <p><strong>🕐 Preferred Time:</strong> ${preferredTime}</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #7f8c8d;">
            <strong>📍 Source:</strong> Website Appointment Form<br>
            <strong>🏥 Center:</strong> Dr. Jadhavar Physiotherapy & Rehabilitation Center
          </p>
        </div>

        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
          <p style="margin: 0; color: #2e7d32;">
            <strong>Action Required:</strong> Please confirm this appointment within 24 hours.
          </p>
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #7f8c8d;">
          <p>© ${new Date().getFullYear()} Dr. Jadhavar Physiotherapy & Rehabilitation Center</p>
        </div>
      </div>
    `;

    // Email 2: Send Auto-reply to User
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          🏥 Thank You for Booking!
        </h2>
        
        <div style="text-align: center; margin: 20px 0;">
          <h3 style="color: #27ae60;">Appointment Request Received ✅</h3>
          <p style="color: #34495e;">We have received your appointment request with the following details:</p>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${formattedDate}</p>
          <p><strong>🕐 Time:</strong> ${preferredTime}</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⏳ Next Steps:</strong><br>
            Our team will confirm your appointment shortly via WhatsApp or call.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #2c3e50;">📍 Location</h4>
          <p style="color: #34495e;">
            Dr. Jadhavar Physiotherapy & Rehabilitation Center
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #2c3e50;">💡 What to Bring:</h4>
          <ul style="color: #34495e;">
            <li>Any previous medical reports</li>
            <li>Prescriptions (if any)</li>
            <li>Comfortable clothing for examination</li>
          </ul>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #2c3e50;">🕐 Working Hours:</h4>
          <p style="color: #34495e;">
            Monday - Saturday: 9:00 AM - 8:00 PM<br>
            Sunday: Closed
          </p>
        </div>

        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32;">
            <strong>📞 For urgent queries, call us at:</strong> <a href="tel:+917700995363" style="color: #2e7d32; text-decoration: none; font-weight: bold;">+91 77009 95363</a>
          </p>
        </div>

        <div style="margin: 20px 0; text-align: center;">
          <a href="https://wa.me/917700995363" style="background-color: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            💬 Chat on WhatsApp
          </a>
        </div>

        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #7f8c8d; text-align: center;">
          <p>We look forward to helping you recover and move better! 💪</p>
          <p>© ${new Date().getFullYear()} Dr. Jadhavar Physiotherapy & Rehabilitation Center</p>
        </div>
      </div>
    `;

    // Send admin email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'drpratibhajadhavar@gmail.com',
      subject: `New Appointment Request - ${name}`,
      html: adminEmailHtml
    });

    // Send user auto-reply email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: `${mobile}@email.com`, // Note: This is a placeholder - users need to provide email
      subject: 'Appointment Confirmation - Dr. Jadhavar Physiotherapy',
      html: userEmailHtml
    });

    // Send response
    res.status(200).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: {
        name,
        mobile,
        preferredDate: formattedDate,
        preferredTime
      }
    });

  } catch (error) {
    console.error('Error processing appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process appointment. Please try again.',
      error: error.message
    });
  }
});

// ===============================
// Health Check Route
// ===============================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dr. Jadhavar Physiotherapy Backend is Running Successfully 🚀'
  });
});

// ===============================
// API Routes
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/blogs', blogRoutes);
// app.use('/api/notices', noticeRoutes);

// ===============================
// Error Handling Middleware
// ===============================
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message: 'File is too large. Maximum upload size is 100 MB.'
    });
  }

  if (err.message?.includes('File size too large')) {
    return res.status(413).json({
      message: 'Cloudinary rejected this file after processing. Try a smaller image or video.'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// ===============================
// MongoDB Connection
// ===============================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('========================================');
    console.log('✅ MongoDB Connected Successfully');
    console.log('========================================');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🚀====================================🚀');
      console.log('      BACKEND STARTED SUCCESSFULLY');
      console.log('🚀====================================🚀');
      console.log(`📌 Local Server : http://localhost:${PORT}`);
      console.log(`🌐 Website      : https://drjadhavarphysiotherapy.com`);
      console.log(`🔗 API Base URL : https://drjadhavarphysiotherapy.com/api`);
      console.log(`❤️ Health Check : https://drjadhavarphysiotherapy.com/`);
      console.log(`⚡ Running Port : ${PORT}`);
      console.log('========================================');
      console.log('');
    });
  })
  .catch((error) => {
    console.error('========================================');
    console.error('❌ MongoDB Connection Failed');
    console.error(error.message);
    console.error('========================================');
    process.exit(1);
  });