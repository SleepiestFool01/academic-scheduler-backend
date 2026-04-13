/**
 * Shared HTML email templates for the Academic Scheduler.
 * Each function returns a full HTML document string with inline CSS.
 */

// ── Formatting helpers ─────────────────────────────────────────────────────
// Converts "2026-04-13" → "Sunday, Apr 13, 2026"
function fmtDate(raw) {
  if (!raw || typeof raw !== "string") return raw || "N/A";
  const parts = raw.split("-");
  if (parts.length !== 3) return raw;
  const [y, m, d] = parts.map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

// Converts "17:00:00" or "17:00" → "5:00 PM"
function fmtTime(raw) {
  if (!raw || typeof raw !== "string") return raw || "N/A";
  const parts = raw.split(":");
  let h = Number(parts[0]);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

const FONT_STACK = "'Satoshi', 'Segoe UI', Roboto, Arial, sans-serif";
const BG_DARK = "#0d0d14";
const BG_CARD = "#13131f";
const ACCENT = "#FF1744";
const TEXT = "#F0E6D3";
const TEXT_MUTED = "#9e9e9e";

function layout(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BG_DARK};font-family:${FONT_STACK};color:${TEXT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_DARK};padding:40px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:${BG_CARD};border-radius:12px;padding:40px;max-width:560px;">
    <tr><td>
      <h2 style="margin:0 0 8px;font-size:22px;color:${ACCENT};font-weight:700;">${title}</h2>
      ${bodyContent}
      <hr style="border:none;border-top:1px solid #222;margin:28px 0 16px;">
      <p style="margin:0;font-size:12px;color:${TEXT_MUTED};">Academic Scheduler &mdash; This is an automated notification.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function detail(label, value) {
  return `<tr><td style="padding:4px 12px 4px 0;color:${TEXT_MUTED};font-size:14px;">${label}</td><td style="padding:4px 0;font-size:14px;color:${TEXT};">${value}</td></tr>`;
}

function detailsTable(rows) {
  return `<table style="margin:16px 0;" cellpadding="0" cellspacing="0">${rows}</table>`;
}

// ── Shift Notifications ─────────────────────────────────────────────

export function shiftAssignedEmail(employeeName, date, startTime, endTime, positionName) {
  return layout("Shift Assigned", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${employeeName}</strong>, you&rsquo;ve been assigned a new shift.</p>
    ${detailsTable(
      detail("Date", fmtDate(date)) +
      detail("Time", `${fmtTime(startTime)} &ndash; ${fmtTime(endTime)}`) +
      (positionName ? detail("Position", positionName) : "")
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Check the dashboard for full details.</p>
  `);
}

export function shiftReminderEmail(employeeName, date, startTime, endTime, positionName, minutesUntil) {
  return layout("Shift Reminder", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${employeeName}</strong>, your shift starts in <strong>${minutesUntil} minutes</strong>.</p>
    ${detailsTable(
      detail("Date", fmtDate(date)) +
      detail("Time", `${fmtTime(startTime)} &ndash; ${fmtTime(endTime)}`) +
      (positionName ? detail("Position", positionName) : "")
    )}
  `);
}

// ── Swap / Tradeboard Notifications ─────────────────────────────────

export function swapPostedEmail(managerName, posterName, date, time, positionName) {
  return layout("Shift Posted to Tradeboard", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${managerName}</strong>, a shift has been posted to the tradeboard.</p>
    ${detailsTable(
      detail("Posted by", posterName) +
      detail("Date", fmtDate(date)) +
      detail("Time", fmtTime(time)) +
      (positionName ? detail("Position", positionName) : "")
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Review and approve from the dashboard when it is claimed.</p>
  `);
}

export function swapClaimedEmail(posterName, claimerName, date, time, positionName) {
  return layout("Your Shift Was Claimed", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${posterName}</strong>, someone has claimed your posted shift.</p>
    ${detailsTable(
      detail("Claimed by", claimerName) +
      detail("Date", fmtDate(date)) +
      detail("Time", fmtTime(time)) +
      (positionName ? detail("Position", positionName) : "")
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">A manager will review and approve or deny the swap.</p>
  `);
}

export function swapApprovedEmail(employeeName, date, time, positionName) {
  return layout("Swap Approved", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${employeeName}</strong>, your shift swap has been <span style="color:#4CAF50;font-weight:700;">approved</span>.</p>
    ${detailsTable(
      detail("Date", fmtDate(date)) +
      detail("Time", fmtTime(time)) +
      (positionName ? detail("Position", positionName) : "")
    )}
  `);
}

export function swapDeniedEmail(employeeName, date, time, positionName) {
  return layout("Swap Denied", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${employeeName}</strong>, your shift swap has been <span style="color:${ACCENT};font-weight:700;">denied</span>.</p>
    ${detailsTable(
      detail("Date", fmtDate(date)) +
      detail("Time", fmtTime(time)) +
      (positionName ? detail("Position", positionName) : "")
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Contact your manager if you have questions.</p>
  `);
}

// ── Department Access Notifications ─────────────────────────────────

export function deptAccessRequestedEmail(adminName, requesterName, deptName) {
  return layout("New Department Access Request", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${adminName}</strong>, a new department access request has been submitted.</p>
    ${detailsTable(
      detail("Requested by", requesterName) +
      detail("Department", deptName)
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Review this request from the Requests page.</p>
  `);
}

export function deptAccessApprovedEmail(requesterName, deptName) {
  return layout("Department Access Approved", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${requesterName}</strong>, your request to access the <strong>${deptName}</strong> department has been <span style="color:#4CAF50;font-weight:700;">approved</span>.</p>
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">You can now view and manage this department from your dashboard.</p>
  `);
}

export function deptAccessDeniedEmail(requesterName, deptName) {
  return layout("Department Access Denied", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${requesterName}</strong>, your request to access the <strong>${deptName}</strong> department has been <span style="color:${ACCENT};font-weight:700;">denied</span>.</p>
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Contact an administrator if you believe this is an error.</p>
  `);
}

// ── Time-Off / Availability Notifications ───────────────────────────

export function timeOffRequestedEmail(managerName, employeeName, startDate, endDate) {
  return layout("Time-Off Request", `
    <p style="margin:12px 0;font-size:15px;">Hi <strong>${managerName}</strong>, a time-off request has been submitted.</p>
    ${detailsTable(
      detail("Employee", employeeName) +
      detail("From", fmtDate(startDate)) +
      detail("To", fmtDate(endDate))
    )}
    <p style="margin:16px 0 0;font-size:14px;color:${TEXT_MUTED};">Please review upcoming schedule coverage.</p>
  `);
}
