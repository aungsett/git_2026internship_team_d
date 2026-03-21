# RecruitPro ATS (Applicant Tracking System)

Applicant Tracking System for Japanese language programs: applicants can register, log in, and submit course applications (with CV upload); admins can review applications, update status, and export data.

---

## Project structure

- **`backend/`** — Express (Node.js) API: auth, applications, courses, admin endpoints. Uses PostgreSQL and JWT.
- **`frontend/`** — Next.js app: landing, login/signup, applicant dashboard and multi-step application form, admin dashboard and applicant detail pages.

---

## Prerequisites

- **Node.js** (v18+ recommended)
- **PostgreSQL** (e.g. 14+) running locally or remotely
- **npm** (or yarn/pnpm)

---

## Backend setup and run

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Database

Create the database and apply the schema:

```bash
# Create DB (if not exists)
createdb ats_db

# Apply schema and seed data (courses + default admin user)
psql -d ats_db -f init_db.sql
```

Or from inside `psql` after connecting to `ats_db`:

```sql
\i init_db.sql
```

For an existing DB that only needs the `course_schedule` column:

```bash
psql -d ats_db -c "ALTER TABLE applications ADD COLUMN IF NOT EXISTS course_schedule VARCHAR(50);"
```

### 3. Environment variables

Copy the example env file and set your values:

```bash
cp .env.example .env
```

Edit `backend/.env`:

| Variable     | Description                          | Example                    |
|-------------|--------------------------------------|----------------------------|
| `PORT`      | Server port                          | `5000`                     |
| `DB_USER`   | PostgreSQL username                  | `postgres`                 |
| `DB_HOST`   | PostgreSQL host                      | `localhost`                |
| `DB_NAME`   | Database name                        | `ats_db`                   |
| `DB_PASSWORD` | PostgreSQL password                | your password              |
| `DB_PORT`   | PostgreSQL port                      | `5432`                     |
| `JWT_SECRET`| Secret for signing JWTs (min 32 chars) | long random string       |
| `SMTP_HOST` | Outgoing mail server (optional; enables applicant emails) | e.g. `smtp.gmail.com` |
| `SMTP_USER` | SMTP login username | your mailbox or API user |
| `SMTP_PASS` | SMTP password or app password | (keep secret) |
| `MAIL_FROM` | Visible “From” address (optional; defaults to `SMTP_USER`) | e.g. `noreply@yourdomain.com` |
| `SMTP_PORT` | SMTP port (optional) | `587` (TLS) or `465` (SSL) |
| `SMTP_SECURE` | Use SSL (optional; often `true` with port 465) | `false` or `true` |

**Email notifications (optional):** If `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are set, applicants receive a **confirmation email** when they submit an application and an **update email** when an admin changes their status (e.g. Shortlisted, Rejected). If SMTP is omitted, the API still works; emails are simply skipped. Implementation: `backend/services/mail.js`, triggered from `POST /api/v1/applications` and `PATCH /api/v1/admin/applications/:id/status`. With **Gmail**, the address recipients see often matches the account you authenticate with unless you use “Send mail as” or the same address for `SMTP_USER` and `MAIL_FROM`.

### 4. Create uploads folder (for CVs)

The API stores uploaded files under `backend/uploads/`. Create it if missing:

```bash
mkdir -p backend/uploads
```

### 5. Admin user with known password

`init_db.sql` seeds an admin user with a hashed password. To use a **known** admin password, run:

```bash
cd backend
node scripts/create-admin.js
```

Default: `admin@ats.com` / `Admin@123`. Custom:

```bash
node scripts/create-admin.js your@email.com YourPassword
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

- **Dev:** `npm run dev` (nodemon, restarts on file change)
- **Prod:** `npm start`

API base: **http://localhost:5000**. Routes are under **/api/v1** (e.g. `/api/v1/auth/login`, `/api/v1/courses`, `/api/v1/applications`).

More backend details: see **`backend/README.md`**.

### Backend tests and HTML report

From `backend/`, run `npm test`. Jest runs `backend/__tests__/` and also writes an HTML summary to **`backend/test-report/index.html`** (see `backend/test-report/README.md`). Open that file in a browser for a pass/fail report.

---

## Frontend setup and run

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Environment variables

Create `frontend/.env.local` (optional; defaults work for local dev):

| Variable               | Description                    | Default (if unset)           |
|------------------------|--------------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL           | `http://localhost:5000/api/v1` |
| `BACKEND_API_URL` or `REACT_APP_API_URL` | Used by API routes that proxy to backend | `http://localhost:5000/api/v1` |

For production, set `NEXT_PUBLIC_API_URL` to your backend URL (e.g. `https://api.yourdomain.com/api/v1`).

Optional (for Google sign-in via NextAuth):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)

### 3. Start the frontend

```bash
cd frontend
npm run dev
```

App: **http://localhost:3000**.

- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Prod:** `npm start` (after `npm run build`)

---

## Running the full project

1. Start **PostgreSQL** and ensure the DB and schema are set up (see Backend → Database).
2. Start **backend**: `cd backend && npm run dev` (default port 5000).
3. Start **frontend**: `cd frontend && npm run dev` (default port 3000).
4. Open **http://localhost:3000** in the browser.

- **Applicant:** Sign up → Log in → Dashboard → Apply for a course (multi-step form + CV).
- **Admin:** Log in at `/admin-login` (use credentials from `create-admin.js`) → Dashboard → view/update applications, export CSV, download CVs.

---

## Main routes (frontend)

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Applicant login |
| `/signup` | Applicant registration |
| `/admin-login` | Admin login |
| `/dashboard` | Applicant dashboard (requires login) |
| `/applicant/apply` | Multi-step application form (requires login) |
| `/admin-login/dashboard` | Admin applications list (requires admin) |
| `/admin-login/dashboard/applicants/[id]` | Admin applicant detail + status + CV download |
| `/terms` | Terms & Privacy |

---

## Backend API overview

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/google`
- **Public:** `GET /api/v1/courses`
- **Applicant (Bearer token):** `POST /api/v1/applications` (multipart with `cv_file`)
- **Admin (Bearer token + admin role):**  
  `GET /api/v1/admin/applications`, `GET /api/v1/admin/applications/:id`,  
  `GET /api/v1/admin/applications/:id/cv`, `PATCH /api/v1/admin/applications/:id/status`,  
  `GET /api/v1/admin/stats`, `GET /api/v1/admin/export/csv`

Login responses return `{ token, role }`. Use `Authorization: Bearer <token>` for protected routes.

---

## Tech stack

- **Backend:** Node.js, Express, PostgreSQL (pg), JWT (jsonwebtoken), bcryptjs, multer (file upload), dotenv, cors, nodemailer (optional SMTP for applicant emails).
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, NextAuth (optional Google).

---

## License

ISC (or as specified in the repo).
