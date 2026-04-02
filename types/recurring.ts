export interface RecurringRide {
  id: string;
  label: string;
  location: { lat: number; lon: number; label: string };
  daysOfWeek: number[];   // 0 = Sun, 1 = Mon … 6 = Sat
  startTime: string;      // "18:00"
  durationHours: number;
  active: boolean;
  createdAt: string;
}
