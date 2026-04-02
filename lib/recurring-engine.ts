import { getRides, saveRide } from './ride-storage';
import { getRecurringRides } from './recurring-storage';
import { RecurringRide } from '../types/recurring';
import { Ride } from '../types/ride';

const DAYS_AHEAD = 14;

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function upcomingDates(rule: RecurringRide): string[] {
  const dates: string[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    if (rule.daysOfWeek.includes(d.getDay())) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

/**
 * Creates ride instances for all active recurring rules for the next 14 days.
 * Skips dates that already have a ride from the same rule.
 * Does NOT fetch weather — home screen auto-refresh handles that.
 * Returns the number of new rides created.
 */
export async function generateRecurringInstances(): Promise<number> {
  const [rules, existing] = await Promise.all([getRecurringRides(), getRides()]);
  const active = rules.filter((r) => r.active);
  if (!active.length) return 0;

  let created = 0;
  for (const rule of active) {
    for (const date of upcomingDates(rule)) {
      const exists = existing.some((r) => r.recurringId === rule.id && r.date === date);
      if (exists) continue;

      const ride: Ride = {
        id: uuid(),
        label: rule.label,
        date,
        startTime: rule.startTime,
        durationHours: rule.durationHours,
        location: rule.location,
        recurringId: rule.id,
      };
      await saveRide(ride);
      existing.push(ride); // keep local list in sync to avoid duplicate within same run
      created++;
    }
  }
  return created;
}
