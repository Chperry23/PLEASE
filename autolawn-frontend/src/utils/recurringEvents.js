import { addWeeks, addMonths, setDate, getDate, format } from 'date-fns';

export const RECURRENCE_TYPES = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  ONETIME: 'onetime'
};

export const generateRecurringSeries = (job, startDate, recurrenceType, occurrences = 12) => {
  const series = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < occurrences; i++) {
    series.push({
      ...job,
      start: format(currentDate, "yyyy-MM-dd'T'HH:mm:ss"),
      seriesId: `${job._id}-series`,
      occurrence: i + 1
    });

    switch (recurrenceType) {
      case RECURRENCE_TYPES.WEEKLY:
        currentDate = addWeeks(currentDate, 1);
        break;
      case RECURRENCE_TYPES.BIWEEKLY:
        currentDate = addWeeks(currentDate, 2);
        break;
      case RECURRENCE_TYPES.MONTHLY:
        currentDate = addMonths(currentDate, 1);
        break;
      default:
        return series.slice(0, 1); // Return only first occurrence for one-time events
    }
  }

  return series;
};

export const updateSeriesOccurrence = (series, occurrenceId, changes, affectFuture = false) => {
  const occurrenceIndex = series.findIndex(event => event.id === occurrenceId);
  
  if (occurrenceIndex === -1) return series;

  if (affectFuture) {
    // Update this and all future occurrences
    return series.map((event, index) => {
      if (index >= occurrenceIndex) {
        return { ...event, ...changes };
      }
      return event;
    });
  } else {
    // Update only this occurrence
    return series.map(event => {
      if (event.id === occurrenceId) {
        return { ...event, ...changes };
      }
      return event;
    });
  }
}; 