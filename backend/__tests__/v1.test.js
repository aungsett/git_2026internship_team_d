const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app'); 


process.env.JWT_SECRET = 'super-secret-test-key';


//Mock the database connection
jest.mock('../db', () => {
  return {
    query: jest.fn(),
    connect: jest.fn(),
  };
});

// Real SMTP is not used in tests: stub mail so routes can call notify* without nodemailer or .env.
jest.mock('../services/mail', () => ({
  notifyApplicationSubmitted: jest.fn().mockResolvedValue(undefined),
  notifyApplicationStatus: jest.fn().mockResolvedValue(undefined),
}));

// Resume files are stored in S3 in production; tests stub these calls.
jest.mock('../services/s3', () => ({
  uploadResumeToS3: jest.fn().mockResolvedValue({
    key: 'resumes/test/user-1/test-resume.pdf',
    bucket: 'git-2026internship-team-d',
    etag: 'etag-test',
  }),
  getResumeFromS3: jest.fn(),
  deleteResumeFromS3: jest.fn().mockResolvedValue(undefined),
}));

const pool = require('../db');


// Mock bcrypt 
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('fake_hashed_password'),
  compare: jest.fn(),
}));
const bcrypt = require('bcryptjs');

describe('API V1 Routes', () => {
  
  // Clear all mocks before each test runs
  beforeEach(() => {
    jest.clearAllMocks();
  });

describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return status 201', async () => {
      // Fake the DB response for the INSERT query
      pool.query.mockResolvedValue({
        rows:[{ user_id: 1, full_name: 'John Doe', email: 'test@test.com', role: 'applicant' }]
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ 
          full_name: 'Tanaka San',   
          email: 'test@test.com', 
          password: 'password123' 
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.email).toBe('test@test.com');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('Database Error Handling (500s)', () => {
    it('should return 500 when GET /courses database query fails', async () => {
      // Force the database to throw an error
      pool.query.mockRejectedValue(new Error('Database disconnected!'));

      const res = await request(app).get('/api/v1/courses');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Database disconnected!');
    });
  });
  
  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      // Mock DB finding the user
      pool.query.mockResolvedValue({
        rows:[{ user_id: 1, email: 'test@test.com', password_hash: 'hashed', role: 'applicant' }]
      });
      // Mock bcrypt saying the password matches
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('applicant');
    });

    it('should return 403 if password is wrong', async () => {
      pool.query.mockResolvedValue({
        rows:[{ user_id: 1, password_hash: 'hashed', role: 'applicant' }]
      });
      // Mock bcrypt saying password DOES NOT match
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Incorrect password');
    });

    it('should return 400 if user does not exist', async () => {
      // Mock DB returning empty array
      pool.query.mockResolvedValue({ rows:[] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('GET /api/v1/applications/my-status', () => {
    it('should return the applicants current statuses', async () => {
      const applicantToken = jwt.sign({ user_id: 5, role: 'applicant' }, process.env.JWT_SECRET);
      
      pool.query.mockResolvedValue({
        rows:[{ application_id: 1, status: 'Under Review', course_name: 'Tech' }]
      });

      const res = await request(app)
        .get('/api/v1/applications/my-status')
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body[0].status).toBe('Under Review');
    });
  });

  describe('Auth Middleware Security', () => {
    it('should return 401 if no token is provided', async () => {
      // Try to hit a protected route without setting the Authorization header
      const res = await request(app).get('/api/v1/applications/my-status');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Access token required');
    });

    it('should return 403 if token is invalid or tampered with', async () => {
      // Send a completely fake token
      const res = await request(app)
        .get('/api/v1/applications/my-status')
        .set('Authorization', 'Bearer I_AM_A_FAKE_HACKER_TOKEN');

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Invalid token');
    });
  });


  describe('GET /api/v1/courses', () => {
    it('should return a list of courses', async () => {
      // Fake the DB response for courses
      const mockCourses =[{ course_id: 1, course_name: 'Engineering' }];
      pool.query.mockResolvedValue({ rows: mockCourses });

      const res = await request(app).get('/api/v1/courses');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockCourses);
    });
  });

  describe('GET /api/v1/admin/applications', () => {
    it('should return applications with filters applied', async () => {
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      pool.query.mockResolvedValue({
        rows:[{ application_id: 1, full_name: 'John Doe', status: 'New' }]
      });

      // We add query parameters like ?status=New&search=John
      const res = await request(app)
        .get('/api/v1/admin/applications?status=New&search=John')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      // Ensures the SQL query actually received our filter variables
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'), // Checks if search wildcard was added
        expect.any(Array)
      );
    });
  });

  describe('GET /api/v1/admin/applications/:id', () => {
    it('should return 404 if the application does not exist', async () => {
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      // Mock the DB returning an empty array (meaning no application was found)
      pool.query.mockResolvedValue({ rows:[] });

      const res = await request(app)
        .get('/api/v1/admin/applications/9999') // Fake ID
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Application not found');
    });

    it('should return the application details if found', async () => {
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      // Mock the DB finding the application
      pool.query.mockResolvedValue({ 
        rows:[{ application_id: 5, full_name: 'Mark Smith', status: 'New' }] 
      });

      const res = await request(app)
        .get('/api/v1/admin/applications/5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.full_name).toBe('Mark Smith');
    });
  });
  
  describe('PATCH /api/v1/admin/applications/:id/status', () => {
    it('should update status and log history', async () => {
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ status: 'New' }] }),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      // After COMMIT, the route loads applicant + course for the status email; mock that row for pool.query.
      pool.query.mockResolvedValue({
        rows: [{
          email: 'applicant@test.com',
          full_name: 'Applicant',
          course_name: 'Japanese for Beginners',
        }],
      });

      const res = await request(app)
        .patch('/api/v1/admin/applications/100/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Shortlisted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.new_status).toBe('Shortlisted');
      
      // Verify transaction queries
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE applications SET status = $1 WHERE application_id = $2',['Shortlisted', '100']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/applications', () => {
    it('should submit an application with a CV file', async () => {

      const mockClient = {
        query: jest.fn().mockResolvedValue({ 
          rows:[{ applicant_id: 99, application_id: 100 }] 
        }),
        release: jest.fn()
      };
      pool.connect.mockResolvedValue(mockClient);
      // After COMMIT, the route loads applicant + course for the confirmation email; mock that row for pool.query.
      pool.query.mockResolvedValue({
        rows: [{
          email: 'applicant@test.com',
          full_name: 'Applicant',
          course_name: 'Japanese for Beginners',
        }],
      });

      // Create a fake valid JWT token so `authenticateToken` passes
      const token = jwt.sign({ user_id: 1, role: 'applicant' }, process.env.JWT_SECRET);

      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${token}`)
        .field('phone_number', '1234567890')
        .field('course_id', '5')
        //simulate upload of file
        .attach('cv_file', Buffer.from('fake pdf content'), 'resume.pdf');

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Application submitted successfully');
      
      // Verify that the transaction started and finished
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/export/csv', () => {
    it('should export applicants as a CSV text file', async () => {
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      // Mock the database returning one applicant
      pool.query.mockResolvedValue({
        rows:[{ 
          full_name: 'Jane Doe', 
          email: 'jane@test.com', 
          course_name: 'Engineering', 
          status: 'Shortlisted', 
          applied_on: '2026-03-14T10:00:00.000Z' // Fake date
        }]
      });

      const res = await request(app)
        .get('/api/v1/admin/export/csv')
        .set('Authorization', `Bearer ${adminToken}`);

      // Expect a 200 Success and verify the Headers tell the browser it's a CSV
      expect(res.statusCode).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      
      // Check if the CSV content actually contains our mocked data
      expect(res.text).toContain('Jane Doe');
      expect(res.text).toContain('jane@test.com');
      expect(res.text).toContain('Shortlisted');
    });
  });

  
  describe('GET /api/v1/admin/stats', () => {
    it('should block non-admins from viewing stats', async () => {
      // Create a token with the 'applicant' role
      const applicantToken = jwt.sign({ user_id: 1, role: 'applicant' }, process.env.JWT_SECRET);

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${applicantToken}`);

      // Should hit the isAdmin middleware and bounce back
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Admin access required');
    });

    it('should allow admins to view stats', async () => {
      // Create an 'admin' token
      const adminToken = jwt.sign({ user_id: 1, role: 'admin' }, process.env.JWT_SECRET);
      
      pool.query.mockResolvedValue({
        rows: [{ total_applications: 10 }]
      });

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.total_applications).toBe(10);
    });
  });
});