/**
 * API v1 routes for the ATS backend.
 * - Auth: register, login, Google OAuth
 * - Public: GET /courses
 * - Applicant (authenticated): POST /applications (with CV upload)
 * - Admin (authenticated + isAdmin): applications list/detail, status update, stats, CSV export, CV download
 *
 * Email (optional): after a successful application submit, the applicant gets a confirmation email.
 * After an admin changes status, the applicant gets a status email. Implemented in ../services/mail.js
 * and triggered from POST /applications and PATCH /admin/applications/:id/status below.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
// Sends applicant emails (SMTP optional). Does not block API responses if sending fails.
const mail = require('../services/mail');
const { uploadResumeToS3, getResumeFromS3, deleteResumeFromS3 } = require('../services/s3');

// Allowed values for PATCH /admin/applications/:id/status (must match DB CHECK constraint).
const APPLICATION_STATUSES = ['New', 'Under Review', 'Shortlisted', 'Rejected'];

// --- File upload (CV/Resume) ---
// Files are buffered in memory and uploaded directly to S3 (never persisted to local disk).
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/** POST /auth/google — Create or find user by Google email, return JWT and role */
router.post("/auth/google", async (req, res) => {
  const { full_name, email } = req.body;

  try {
    // Check if user exists
    let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    let user;

    if (result.rows.length === 0) {
      // New Google user → create in DB
      const dummyHash = await bcrypt.hash("GOOGLE_AUTH_USER", 10);

      const insertRes = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, full_name, email, role`,
        [full_name, email, dummyHash, "applicant"]
      );

      user = insertRes.rows[0];
    } else {
      user = result.rows[0];
    }

    // Sign JWT for backend auth
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /auth/register — Create new applicant user (full_name, email, password). Returns created user row. */
router.post('/auth/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING user_id, full_name, email, role`,
      [full_name, email, hashedPassword, 'applicant']
    );

    const createdUser = result.rows[0];
    if (createdUser?.email) {
      // Fire-and-forget welcome email so registration response is not delayed by SMTP.
      void mail.notifyAccountCreated({
        to: createdUser.email,
        applicantName: createdUser.full_name,
      });
    }

    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /auth/login — Email/password login. Returns { token, role }. Used for both applicant and admin (role checked on frontend). */
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = result.rows[0];
    if (await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ user_id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, role: user.role });
    } else {
      res.status(403).json({ error: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// --- Applicant / public endpoints ---

/** GET /courses — List all courses (for application form dropdown). No auth required. */
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/** POST /applications — Submit application (authenticated). Creates/updates applicant, creates application and optional document. Expects multipart with cv_file. */
router.post('/applications', authenticateToken, upload.single('cv_file'), async (req, res) => {
  const client = await pool.connect();
  let uploadedS3Key = null;
  try {
    await client.query('BEGIN');

    const { 
        full_name,
        phone_number, location, date_of_birth, 
        highest_degree, field_of_study, university, graduation_year, 
        gpa_percentage, years_experience, current_job_title, 
        company_name, industry, professional_summary, course_id,
        course_schedule
    } = req.body;

    // Get full_name from users if not provided (e.g. from JWT/session later)
    let applicantFullName = full_name;
    if (!applicantFullName) {
      const userRow = await client.query('SELECT full_name FROM users WHERE user_id = $1', [req.user.user_id]);
      applicantFullName = userRow.rows[0]?.full_name || 'Applicant';
    }

    const applicantRes = await client.query(
      `INSERT INTO applicants (user_id, full_name, phone_number, location, date_of_birth, highest_degree, field_of_study, university, graduation_year, gpa_percentage, years_experience, current_job_title, company_name, industry, professional_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (user_id) DO UPDATE SET 
       full_name = EXCLUDED.full_name, phone_number = EXCLUDED.phone_number, location = EXCLUDED.location,
       date_of_birth = EXCLUDED.date_of_birth, highest_degree = EXCLUDED.highest_degree, field_of_study = EXCLUDED.field_of_study,
       university = EXCLUDED.university, graduation_year = EXCLUDED.graduation_year, gpa_percentage = EXCLUDED.gpa_percentage,
       years_experience = EXCLUDED.years_experience, current_job_title = EXCLUDED.current_job_title,
       company_name = EXCLUDED.company_name, industry = EXCLUDED.industry, professional_summary = EXCLUDED.professional_summary
       RETURNING applicant_id`,
      [req.user.user_id, applicantFullName, phone_number, location, date_of_birth, highest_degree, field_of_study, university, graduation_year, gpa_percentage, years_experience, current_job_title, company_name, industry, professional_summary]
    );
    
    const applicant_id = applicantRes.rows[0].applicant_id;

    let finalCourseId = course_id && String(course_id).trim() ? parseInt(course_id, 10) : null;
    if (finalCourseId == null || isNaN(finalCourseId)) {
      const firstCourse = await client.query('SELECT course_id FROM courses LIMIT 1');
      finalCourseId = firstCourse.rows[0]?.course_id || 1;
    }

    const appRes = await client.query(
      'INSERT INTO applications (applicant_id, course_id, course_schedule, status) VALUES ($1, $2, $3, $4) RETURNING application_id',
      [applicant_id, finalCourseId, course_schedule || null, 'New']
    );
    const application_id = appRes.rows[0].application_id;

    if (req.file) {
      const uploaded = await uploadResumeToS3({
        userId: req.user.user_id,
        file: req.file,
      });
      uploadedS3Key = uploaded.key;

      await client.query(
        'INSERT INTO documents (application_id, file_name, file_path, file_size) VALUES ($1, $2, $3, $4)',
        [application_id, req.file.originalname, uploaded.key, String(req.file.size)]
      );
    }

    await client.query('COMMIT');
    const ref = `APP-${new Date().getFullYear()}-${String(application_id).padStart(5, '0')}`;

    // Post-commit: load applicant email + course name for the confirmation email (uses pool, not the transaction client).
    const emailRes = await pool.query(
      `SELECT u.email, u.full_name, c.course_name
       FROM applications a
       JOIN applicants ap ON a.applicant_id = ap.applicant_id
       JOIN users u ON ap.user_id = u.user_id
       JOIN courses c ON a.course_id = c.course_id
       WHERE a.application_id = $1`,
      [application_id]
    );
    const submittedRow = emailRes.rows[0];
    if (submittedRow?.email) {
      // Fire-and-forget: do not await so a slow SMTP server cannot delay the HTTP response.
      void mail.notifyApplicationSubmitted({
        to: submittedRow.email,
        applicantName: submittedRow.full_name,
        courseName: submittedRow.course_name,
        applicationRef: ref,
      });
    }

    res.status(201).json({ message: 'Application submitted successfully', application_id, application_ref: ref });
  } catch (err) {
    await client.query('ROLLBACK');
    if (uploadedS3Key) {
      try {
        await deleteResumeFromS3(uploadedS3Key);
      } catch (cleanupErr) {
        // Best effort cleanup: log and preserve original failure response.
        console.error('Failed to clean up S3 object after transaction rollback:', cleanupErr.message);
      }
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

//Endpoint for applicant to view his/her status
router.get('/applications/my-status', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.application_id, 
        c.course_name, 
        a.status, 
        a.applied_on,
        -- Get the most recent timestamp from status_history. 
        -- If no history exists yet, fall back to the original applied_on date.
        COALESCE(
          (SELECT changed_at 
           FROM status_history sh 
           WHERE sh.application_id = a.application_id 
           ORDER BY changed_at DESC 
           LIMIT 1),
          a.applied_on
        ) AS last_updated
      FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.applicant_id
      JOIN courses c ON a.course_id = c.course_id
      WHERE ap.user_id = $1
      ORDER BY last_updated DESC
    `;
    
    // req.user.user_id comes from the authenticateToken middleware
    const result = await pool.query(query,[req.user.user_id]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin endpoints (require authenticateToken + isAdmin) ---

/** GET /admin/applications — List applications with optional query: search, status, course_id */
router.get('/admin/applications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { search, status, course_id } = req.query;

    //no filtering base
    let queryText = `
      SELECT a.application_id, a.status, a.applied_on, 
             u.full_name, u.email,
             ap.phone_number, ap.highest_degree, ap.years_experience,
             c.course_name, c.course_level,
             d.file_path as cv_link
      FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.applicant_id
      JOIN users u ON ap.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN documents d ON a.application_id = d.application_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    //filter by status
    if (status && status !== 'All Status') {
      queryText += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    // filter by course
    if (course_id && course_id !== 'All Courses') {
      queryText += ` AND a.course_id = $${paramCount}`;
      queryParams.push(course_id);
      paramCount++;
    }

    // search by name
    if (search) {
      queryText += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`); // Add wildcards for partial match
      paramCount++;
    }

    // sort by newest
    queryText += ` ORDER BY a.applied_on DESC`;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /admin/applications/:id — Full application + applicant + user + course + document for one application */
router.get('/admin/applications/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT a.application_id, a.status, a.applied_on, a.course_schedule,
             u.full_name, u.email,
             ap.*,
             c.course_name, c.course_level,
             d.file_path as cv_link, d.file_name
      FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.applicant_id
      JOIN users u ON ap.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN documents d ON a.application_id = d.application_id
      WHERE a.application_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /admin/applications/:id/cv — Download CV file for application (attachment) */
router.get('/admin/applications/:id/cv', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT file_path, file_name FROM documents WHERE application_id = $1', 
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No CV attached to this application' });
    }

    const fileData = result.rows[0];
    const s3Object = await getResumeFromS3(fileData.file_path);
    res.setHeader('Content-Type', s3Object.contentType || 'application/octet-stream');
    if (s3Object.contentLength) {
      res.setHeader('Content-Length', String(s3Object.contentLength));
    }
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.file_name}"`);

    s3Object.stream.on('error', (streamErr) => {
      console.error('S3 stream error:', streamErr.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream CV' });
      } else {
        res.end();
      }
    });

    s3Object.stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /admin/applications/:id/status — Update application status and log change in status_history.
 * Validates status, returns 404 if the application row is missing, skips DB work if status unchanged.
 * After a successful update, notifies the applicant by email (same ref format as submit: APP-YYYY-NNNNN).
 */
router.patch('/admin/applications/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const newStatus = req.body.status;
  const applicationId = req.params.id;

  if (!newStatus || !APPLICATION_STATUSES.includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const oldRes = await client.query('SELECT status FROM applications WHERE application_id = $1', [applicationId]);
    if (!oldRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldStatus = oldRes.rows[0].status;

    if (oldStatus === newStatus) {
      await client.query('ROLLBACK');
      return res.json({ message: 'Status unchanged', new_status: newStatus });
    }

    await client.query('UPDATE applications SET status = $1 WHERE application_id = $2', [newStatus, applicationId]);

    await client.query(
      'INSERT INTO status_history (application_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
      [applicationId, oldStatus, newStatus, req.user.user_id]
    );

    await client.query('COMMIT');

    // Post-commit: fetch applicant email for the status notification (not part of the transaction above).
    const infoRes = await pool.query(
      `SELECT u.email, u.full_name, c.course_name
       FROM applications a
       JOIN applicants ap ON a.applicant_id = ap.applicant_id
       JOIN users u ON ap.user_id = u.user_id
       JOIN courses c ON a.course_id = c.course_id
       WHERE a.application_id = $1`,
      [applicationId]
    );
    const detailRow = infoRes.rows[0];
    const ref = `APP-${new Date().getFullYear()}-${String(applicationId).padStart(5, '0')}`;
    if (detailRow?.email) {
      void mail.notifyApplicationStatus({
        to: detailRow.email,
        applicantName: detailRow.full_name,
        courseName: detailRow.course_name,
        applicationRef: ref,
        oldStatus,
        newStatus,
      });
    }

    res.json({ message: 'Status updated', new_status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/** GET /admin/stats — Aggregates: total_applications, this_week, shortlisted, pending_review */
router.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) AS total_applications,
        COUNT(CASE WHEN applied_on >= NOW() - INTERVAL '7 days' THEN 1 END) AS this_week,
        COUNT(CASE WHEN status = 'Shortlisted' THEN 1 END) AS shortlisted,
        COUNT(CASE WHEN status = 'Under Review' THEN 1 END) AS pending_review
      FROM applications
    `;
    
    const result = await pool.query(query);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /admin/export/csv — Export all applications as CSV (attachment) */
router.get('/admin/export/csv', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        u.full_name, u.email, 
        ap.phone_number, ap.location, ap.highest_degree, ap.years_experience,
        c.course_name, 
        a.status, a.applied_on
      FROM applications a
      JOIN applicants ap ON a.applicant_id = ap.applicant_id
      JOIN users u ON ap.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      ORDER BY a.applied_on DESC
    `;
    
    const result = await pool.query(query);
    const rows = result.rows;

    //headers
    const headers = ['Full Name', 'Email', 'Phone', 'Location', 'Degree', 'Experience', 'Course', 'Status', 'Applied On'];

    let csvContent = headers.join(',') + '\n';

    rows.forEach(row => {
      const date = new Date(row.applied_on).toISOString().split('T')[0];
      const dataRow = [
        `"${row.full_name}"`,
        `"${row.email}"`,
        `"${row.phone_number || ''}"`,
        `"${row.location || ''}"`,
        `"${row.highest_degree || ''}"`,
        `"${row.years_experience || 0}"`,
        `"${row.course_name}"`,
        `"${row.status}"`,
        `"${date}"`
      ];
      csvContent += dataRow.join(',') + '\n';
    });

    const filename = `applicants_export_${Date.now()}.csv`;
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;