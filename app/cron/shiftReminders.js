import cron from "node-cron";
import { Op } from "sequelize";
import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import { shiftReminderEmail } from "../utils/emailTemplates.js";
import { getPrefs } from "../utils/preferences.js";

const ShiftAssignment = db.shiftAssignment;
const Shift = db.shift;
const Employee = db.employee;
const Position = db.position;

const CRON_INTERVAL_MIN = 15;
const MAX_LOOKAHEAD_MIN = 120;     // support up to 2h lead-time pref
const DEFAULT_LEAD_MIN  = 30;

// Track sent reminders to avoid duplicates (key: "id_shiftAssignment-date")
const sentReminders = new Set();

/**
 * Pad a number to two digits.
 */
function pad(n) {
  return String(n).padStart(2, "0");
}

/**
 * Check for upcoming shifts and send reminder emails.
 * Runs every 15 minutes via node-cron.
 */
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    // Pull the widest lookahead window we might need (2h). We filter per
    // assignment against each user's own lead-time pref below.
    const lookaheadEnd = new Date(now.getTime() + MAX_LOOKAHEAD_MIN * 60 * 1000);
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    const lookaheadEndTime = `${pad(lookaheadEnd.getHours())}:${pad(lookaheadEnd.getMinutes())}:00`;

    // If the lookahead end rolled past midnight, clamp to end-of-day to
    // keep the same-day query valid; shifts after midnight are picked up
    // on the next tick after the date rolls.
    const effectiveEnd = lookaheadEndTime < nowTime ? "23:59:00" : lookaheadEndTime;

    const assignments = await ShiftAssignment.findAll({
      where: { date: todayStr },
      include: [
        {
          model: Shift,
          as: "shift",
          where: {
            startTime: { [Op.gte]: nowTime, [Op.lte]: effectiveEnd },
          },
        },
        { model: Employee, as: "employee" },
      ],
    });

    for (const assignment of assignments) {
      const key = `${assignment.id_shiftAssignment}-${todayStr}`;
      if (sentReminders.has(key)) continue;

      const emp = assignment.employee;
      const shift = assignment.shift;
      if (!emp || !shift) continue;

      // Calculate minutes until shift starts
      const [h, m] = shift.startTime.split(":").map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(h, m, 0, 0);
      const minutesUntil = Math.max(1, Math.round((shiftStart - now) / 60000));

      // Per-user lead-time prefs. Default when the employee has no prefs
      // row for this dept is "enabled at 30 min" — matches pre-prefs behavior.
      const prefs = await getPrefs(emp.id_employee, shift.id_department, "shiftReminders");
      if (prefs.enabled === false) continue;
      const leadTarget = Number.isFinite(prefs.minutesBefore) ? prefs.minutesBefore : DEFAULT_LEAD_MIN;

      // Fire during the cron tick that lands inside the user's lead window:
      //   (leadTarget - CRON_INTERVAL_MIN)  <  minutesUntil  <=  leadTarget
      // Ensures exactly one send even though the cron runs repeatedly.
      if (minutesUntil > leadTarget) continue;
      if (minutesUntil <= leadTarget - CRON_INTERVAL_MIN) continue;

      const pos = shift.id_position ? await Position.findByPk(shift.id_position) : null;
      const posName = pos ? pos.name : null;

      sendEmail(
        emp.email,
        "Shift Reminder — Your shift starts soon",
        shiftReminderEmail(
          `${emp.fName} ${emp.lName}`,
          assignment.date,
          shift.startTime,
          shift.endTime,
          posName,
          minutesUntil
        )
      ).catch(() => {}); // fire-and-forget

      sentReminders.add(key);
    }

    // Prune old keys (anything not from today) to prevent unbounded growth
    for (const key of sentReminders) {
      if (!key.endsWith(todayStr)) {
        sentReminders.delete(key);
      }
    }
  } catch (err) {
    console.error("[shiftReminders] Error checking upcoming shifts:", err.message);
  }
}

/**
 * Start the cron job. Call once after the server starts listening.
 */
export function startShiftReminders() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", checkAndSendReminders);
  console.log("[shiftReminders] Cron job started — checking every 15 minutes.");
}

export default startShiftReminders;
