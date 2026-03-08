/**
 * ATS (Applicant Tracking System) Backend - Express server entry point.
 * Serves REST API at /api/v1 for auth, applications, courses, and admin operations.
 * Requires PostgreSQL and .env configuration (see README).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- Middleware ---
// Allow cross-origin requests from frontend (e.g. Next.js dev server)
app.use(cors());
// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded CV/resume files (e.g. for admin download). Path is relative to backend root.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API v1 routes: auth, applications, courses, admin
const v1Routes = require('./routes/v1');
app.use('/api/v1', v1Routes);

// Global error handler: log and return 500 with safe message
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ATS Backend running on port ${PORT}`);
});