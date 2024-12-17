// src/utils/recurrence.js
const { addDays } = require('date-fns');

function getNextDueDate(job) {
  // job.recurrencePattern: 'Weekly', 'Bi-weekly', 'Monthly'
  // job.lastServiceDate
  // This is a simplified example:
  if (!job.isRecurring) {
    // For one-time jobs, nextDueDate is either scheduledDay or null if not scheduled
    return job.scheduledDay ? new Date(job.scheduledDay) : null;
  }
  const last = job.lastServiceDate ? new Date(job.lastServiceDate) : new Date(job.startDate || Date.now());
  let intervalDays = 0;
  switch (job.recurrencePattern) {
    case 'Weekly':
      intervalDays = 7;
      break;
    case 'Bi-weekly':
      intervalDays = 14;
      break;
    case 'Monthly':
      intervalDays = 30;
      break;
    default:
      intervalDays = 7; // default fallback
  }
  return addDays(last, intervalDays);
}

function isJobDueOnDate(job, date) {
  const dueDate = getNextDueDate(job);
  if (!dueDate) return false;
  dueDate.setHours(0,0,0,0);
  const target = new Date(date);
  target.setHours(0,0,0,0);
  return dueDate <= target;
}

function updateRecurrenceOnMove(job, oldDate, newDate, updateFuture) {
  // If updateFuture is true, we shift the job's recurrence pattern start.
  // If false, we just handle this occurrence.
  // This logic depends on how you store occurrences. For simplicity:
  if (!job.isRecurring) return;
  // If updateFuture:
  if (updateFuture) {
    job.lastServiceDate = newDate;
  } else {
    // Move just this occurrence: maybe store exceptions in a separate collection,
    // or adjust only this occurrence's scheduledDay.
    // For simplicity, we just set lastServiceDate temporarily.
    job.lastServiceDate = newDate;
  }
}

module.exports = {
  getNextDueDate,
  isJobDueOnDate,
  updateRecurrenceOnMove
};
