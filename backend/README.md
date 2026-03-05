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
