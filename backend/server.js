/**
 * ATS (Applicant Tracking System) Backend - Express server entry point.
 * Serves REST API at /api/v1 for auth, applications, courses, and admin operations.
 * Requires PostgreSQL and .env configuration (see README).
 */


require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ATS Backend running on port ${PORT}`);
});