import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import galleryRoutes from './routes/galleryRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5031;

// ===============================
// CORS Configuration - UPDATED
// ===============================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://drjadhavarphysiotherapy.com',
  'https://www.drjadhavarphysiotherapy.com',
  'https://gentle-puffpuff-fa2d0e.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests explicitly

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/appointments', appointmentRoutes);

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