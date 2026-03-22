# ATS Backend

## Run locally

1. **PostgreSQL**: Install and run PostgreSQL (e.g. default port 5432).

2. **Database**:
   - **Full init (new project)**: Create the database and run the full schema:
     ```bash
     createdb ats_db
     psql -d ats_db -f init_db.sql
     ```
     Or from inside `psql` after connecting to `ats_db`: `\i init_db.sql`
   - **Migration only (existing DB)**: If the DB already exists and you only need to add the `course_schedule` column to `applications`:
     ```bash
     psql -d ats_db -c "ALTER TABLE applications ADD COLUMN IF NOT EXISTS course_schedule VARCHAR(50);"
     ```
     Or in `psql`: run that same SQL after connecting to `ats_db`.

3. **Environment**: Copy `.env.example` to `.env` and set your DB credentials:
   - `DB_USER` – PostgreSQL username (e.g. `postgres`)
   - `DB_PASSWORD` – PostgreSQL password
   - `DB_HOST` – usually `localhost`
   - `DB_NAME` – `ats_db`
   - `DB_PORT` – usually `5432`
   - `JWT_SECRET` – long random string for signing tokens
   - `AWS_REGION` – AWS region for your S3 bucket (e.g. `ap-south-1`)
   - `AWS_ACCESS_KEY_ID` – IAM access key with S3 object permissions
   - `AWS_SECRET_ACCESS_KEY` – matching IAM secret
   - `S3_BUCKET_NAME` – bucket name for resumes (for this project: `git-2026internship-team-d`)
   - `S3_KEY_PREFIX` – optional object key prefix (default: `resumes`)

   **Optional — applicant email (SMTP):** To send confirmation emails on application submit and status updates when an admin changes an application, set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` (see comments in `.env.example`). Use `MAIL_FROM` for the visible sender if your provider allows it. If SMTP is not set, the API still runs; emails are skipped.

   **Resume storage behavior:** applicant resume files are uploaded directly to S3. The database stores only object references (S3 keys and metadata), not file binaries.

4. **Start**:
   ```bash
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:5000`.

5. **Admin login**: The DB seed in `init_db.sql` creates one admin user (`admin@ats.com`), but the password is only stored as a hash. To use a **known** admin password, run:
   ```bash
   node scripts/create-admin.js
   ```
   This creates/updates admin `admin@ats.com` with password **`Admin@123`**. To use a different email/password:
   ```bash
   node scripts/create-admin.js your@email.com YourPassword
   ```
   Then open the app → **Admin Login** (or `/admin-login`) and sign in with those credentials.

## Tests and HTML report

- Run **`npm test`** from this folder. Jest executes `__tests__/`.
- **jest-html-reporter** writes **`test-report/index.html`**. Open it in a browser after a test run for a formatted report. See **`test-report/README.md`**.

Mail sending is **mocked** in tests (`jest.mock('../services/mail')`) so no real SMTP or `.env` mail vars are required for CI.
