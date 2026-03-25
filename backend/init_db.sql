CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL, -- Moved here
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'applicant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    course_level VARCHAR(50) NOT NULL CHECK (course_level IN ('Beginner', 'Intermediate', 'Advanced'))
);
CREATE TABLE IF NOT EXISTS applications (
    application_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id),
    course_schedule VARCHAR(50),
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Under Review', 'Shortlisted', 'Rejected')),
    applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Per-application snapshot of what the applicant submitted in the form.
    -- Stored here (not in a shared profile row) so each application is independent.
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    location VARCHAR(100),
    date_of_birth DATE NOT NULL,
    highest_degree VARCHAR(50) NOT NULL,
    field_of_study VARCHAR(100) NOT NULL,
    university VARCHAR(100) NOT NULL,
    graduation_year INT NOT NULL,
    gpa_percentage DECIMAL(5, 2),
    years_experience INT DEFAULT 0,
    current_job_title VARCHAR(100),
    company_name VARCHAR(100),
    industry VARCHAR(100),
    professional_summary TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    document_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS status_history (
    status_hist_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by INT REFERENCES users(user_id), -- Admin ID
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO courses (course_name, course_level) VALUES 
('Japanese for Beginners', 'Beginner'),
('Business Japanese', 'Intermediate'),
('Advanced Kanji', 'Advanced')
ON CONFLICT DO NOTHING;


INSERT INTO users (full_name, email, password_hash, role) 
VALUES ('System Admin', 'admin@ats.com', '$2a$10$Unon/Xl9awFp5fjeYnoJX.Ifwy91H6FK5jII8AEw.Yc4P0Wwid2GK', 'admin');