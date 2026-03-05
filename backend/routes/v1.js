const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');



//file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

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

//register 
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

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//login
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




//applicant endpoints 
// Get courses
router.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//submit application
router.post('/applications', authenticateToken, upload.single('cv_file'), async (req, res) => {
  const client = await pool.connect();
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
      await client.query(
        'INSERT INTO documents (application_id, file_name, file_path, file_size) VALUES ($1, $2, $3, $4)',
        [application_id, req.file.originalname, req.file.path, req.file.size]
      );
    }

    await client.query('COMMIT');
    const ref = `APP-${new Date().getFullYear()}-${String(application_id).padStart(5, '0')}`;
    res.status(201).json({ message: 'Application submitted successfully', application_id, application_ref: ref });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


//dashboard applicants view
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

//single applicant view
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

//get cv alone 
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
    const absolutePath = path.resolve(fileData.file_path);
    res.download(absolutePath, fileData.file_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update status
router.patch('/admin/applications/:id/status', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    await client.query('BEGIN');

    // get old status
    const oldRes = await client.query('SELECT status FROM applications WHERE application_id = $1', [applicationId]);
    const oldStatus = oldRes.rows[0]?.status;

    // update Status
    await client.query('UPDATE applications SET status = $1 WHERE application_id = $2', [status, applicationId]);

    // log History
    await client.query(
      'INSERT INTO status_history (application_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
      [applicationId, oldStatus, status, req.user.user_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Status updated', new_status: status });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

//dashboard stats 
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

//export csv
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