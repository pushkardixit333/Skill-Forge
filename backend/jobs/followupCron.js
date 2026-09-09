const cron = require("node-cron");
const FollowUp = require("../models/FollowUp");

// Runs daily. Finds follow-ups whose due date has arrived and are still
// pending, and fires an automated outreach attempt (IVR/SMS/WhatsApp stub).
// After 3 unanswered automated attempts it flags the record for an assisted
// (human) call, matching the "automated and assisted follow-ups" requirement.
const startFollowUpCron = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      const due = await FollowUp.find({
        status: { $in: ["pending", "attempted"] },
        dueDate: { $lte: new Date() },
      });

      for (const followUp of due) {
        followUp.attempts += 1;
        followUp.status = followUp.attempts >= 3 ? "escalated_to_agent" : "attempted";
        // In production: trigger IVR call / SMS / WhatsApp template here via
        // the telephony/messaging provider's API using followUp.channel.
        await followUp.save();
      }

      if (due.length) {
        console.log(`[followup-cron] processed ${due.length} due follow-up(s)`);
      }
    } catch (err) {
      console.error("[followup-cron] error:", err.message);
    }
  });
};

module.exports = startFollowUpCron;
