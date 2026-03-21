/**
 * Transactional email (nodemailer over SMTP).
 *
 * What this module does:
 * - Sends a confirmation email after an applicant submits an application.
 * - Sends an update email when an admin changes the application status (e.g. Shortlisted).
 *
 * Configuration: set SMTP_HOST, SMTP_USER, and SMTP_PASS in backend/.env (see .env.example).
 * If those are missing, no email is sent (API still returns success so users are not blocked).
 * Send errors are logged only; they are not thrown so HTTP responses always complete normally.
 *
 */

const nodemailer = require('nodemailer');

let transporter = null;

/** Creates a single reusable SMTP connection when env vars are present; otherwise returns null. */
function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

/** Address used in the email "From" field (visible sender when the provider allows it). */
function mailFrom() {
  return process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@localhost';
}

/**
 * Low-level send. Used by the notification helpers below.
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
async function sendMail(opts) {
  const t = getTransporter();
  if (!t) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[mail] SMTP not configured; skipping email to', opts.to);
    }
    return;
  }
  try {
    await t.sendMail({
      from: mailFrom(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text.replace(/\n/g, '<br>'),
    });
  } catch (err) {
    console.error('[mail] send failed:', err.message);
  }
}

/**
 * Email sent right after POST /applications succeeds (application saved in DB).
 * @param {{ to: string, applicantName: string, courseName: string, applicationRef: string }} p
 */
async function notifyApplicationSubmitted(p) {
  const name = p.applicantName || 'Applicant';
  const subject = `Application received — ${p.applicationRef}`;
  const text = [
    `Hello ${name},`,
    '',
    `Thank you for applying. We have received your application (${p.applicationRef}) for ${p.courseName}.`,
    'Our team will review your submission and you will receive another email when your status changes.',
    '',
    'If you did not submit this application, please contact support.',
    '',
    '— RecruitPro ATS',
  ].join('\n');
  await sendMail({ to: p.to, subject, text });
}

/** Short human-readable line for each status (used inside the status-change email body). */
function statusMessage(newStatus) {
  switch (newStatus) {
    case 'New':
      return 'Your application has been recorded as New. We will begin reviewing it shortly.';
    case 'Under Review':
      return 'Your application is now under review. We will notify you again when there is a decision or an update.';
    case 'Shortlisted':
      return 'Congratulations — you have been shortlisted. Our team may reach out with next steps. Please watch your inbox.';
    case 'Rejected':
      return 'Thank you for your interest. After careful review, we are unable to move forward with your application at this time.';
    default:
      return 'Your application status has been updated.';
  }
}

/**
 * Email sent after PATCH /admin/applications/:id/status updates the DB (skipped if old === new status).
 * @param {{ to: string, applicantName: string, courseName: string, applicationRef: string, oldStatus: string|null|undefined, newStatus: string }} p
 */
async function notifyApplicationStatus(p) {
  if (p.oldStatus === p.newStatus) return;
  const name = p.applicantName || 'Applicant';
  const subject = `Application update — ${p.newStatus} (${p.applicationRef})`;
  const bodyLine = statusMessage(p.newStatus);
  const text = [
    `Hello ${name},`,
    '',
    `Your application (${p.applicationRef}) for ${p.courseName} has been updated.`,
    '',
    `Previous status: ${p.oldStatus ?? '—'}`,
    `Current status: ${p.newStatus}`,
    '',
    bodyLine,
    '',
    'You can sign in to the applicant portal anytime to view your latest status.',
    '',
    '— RecruitPro ATS',
  ].join('\n');
  await sendMail({ to: p.to, subject, text });
}

module.exports = {
  sendMail,
  notifyApplicationSubmitted,
  notifyApplicationStatus,
};
