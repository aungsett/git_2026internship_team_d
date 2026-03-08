/**
 * PostgreSQL connection pool for the ATS backend.
 * Used by routes and scripts; configure via .env (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

module.exports = pool;