const FollowUp = require("../models/FollowUp");

const getIntervals = () =>
  (process.env.FOLLOWUP_INTERVALS || "30,90,180,365")
    .split(",")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !Number.isNaN(n));

// Creates one FollowUp record per checkpoint (30/90/180/365 days by default)
// anchored to the placement date, so the follow-up engine can pick them up
// as each due date arrives without any further manual scheduling.
const scheduleFollowUpsForPlacement = async (placement) => {
  if (placement.outcomeType === "not_placed") return [];

  const anchorDate = placement.placementDate ? new Date(placement.placementDate) : new Date();
  const intervals = getIntervals();

  const followUps = intervals.map((days) => {
    const dueDate = new Date(anchorDate);
    dueDate.setDate(dueDate.getDate() + days);
    return {
      traineeId: placement.traineeId,
      placementId: placement._id,
      checkpointDay: days,
      dueDate,
      channel: "automated_ivr",
      status: "pending",
    };
  });

  return FollowUp.insertMany(followUps);
};

module.exports = { scheduleFollowUpsForPlacement, getIntervals };
