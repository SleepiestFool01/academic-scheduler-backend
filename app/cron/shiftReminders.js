import cron from "node-cron";
import { Op } from "sequelize";
import db from "../models/index.js";
import { sendEmail } from "../utils/mailer.js";
import { shiftReminderEmail } from "../utils/emailTemplates.js";

const ShiftAssignment = db.shiftAssignment;
const Shift = db.shift;
const Employee = db.employee;
const Position = db.position;

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

    // Build a time string 30 minutes from now
    const soon = new Date(now.getTime() + 30 * 60 * 1000);
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    const soonTime = `${pad(soon.getHours())}:${pad(soon.getMinutes())}:00`;

    // If soonTime rolled past midnight, skip (edge case: shift at 00:00
    // when current time is 23:45). We only look at same-day shifts.
    if (soonTime < nowTime) return;

    const assignments = await ShiftAssignment.findAll({
      where: { date: todayStr },
      include: [
        {
          model: Shift,
          as: "shift",
          where: {
            startTime: { [Op.gte]: nowTime, [Op.lte]: soonTime },
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
