/**
 * Create or reset an admin user so you can log in at /admin-login.
 * Usage: node scripts/create-admin.js [email] [password]
 * Default: admin@ats.com / Admin@123
 *
 * Run from backend folder: node scripts/create-admin.js
 * (Loads .env from backend directory.)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

/** Creates or updates admin user in DB; verifies password and prints login instructions. */
async function main() {
  const email = process.argv[2] || 'admin@ats.com';
  const password = process.argv[3] || 'Admin@123';
  const hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ('System Admin', $1, $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = 'admin'`,
      [email, hash]
    );

    const check = await pool.query(
      'SELECT user_id, email, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = check.rows[0];

    if (!user) {
      console.error('User not found after insert/update.');
      process.exit(1);
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      console.error('Password verification failed. Login may not work.');
      process.exit(1);
    }

    console.log('Admin user ready.');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password:', password);
    console.log('\nLog in at /admin-login with the above credentials.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
