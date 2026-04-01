export function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDateLong(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function getTonightDefaults() {
  const today = new Date();
  return {
    date: today.toISOString().split('T')[0],
    startTime: '18:00',
    durationHours: 2,
  };
}

export function getWeekendDefaults() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun, 6 = Sat
  const daysUntilSat = day === 6 ? 7 : (6 - day);
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  return {
    date: sat.toISOString().split('T')[0],
    startTime: '10:00',
    durationHours: 3,
  };
}
