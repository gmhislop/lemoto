import { getTonightDefaults, getWeekendDefaults } from '../lib/date-utils';

describe('getTonightDefaults', () => {
  it('returns todays date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(getTonightDefaults().date).toBe(today);
  });

  it('returns 18:00 start time', () => {
    expect(getTonightDefaults().startTime).toBe('18:00');
  });

  it('returns 2 hours duration', () => {
    expect(getTonightDefaults().durationHours).toBe(2);
  });
});

describe('getWeekendDefaults', () => {
  it('returns a Saturday', () => {
    const { date } = getWeekendDefaults();
    const day = new Date(date + 'T00:00:00').getDay();
    expect(day).toBe(6); // 6 = Saturday
  });

  it('returns a date in the future or today if already Saturday', () => {
    const { date } = getWeekendDefaults();
    const result = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    expect(result.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it('returns 10:00 start time', () => {
    expect(getWeekendDefaults().startTime).toBe('10:00');
  });

  it('returns 3 hours duration', () => {
    expect(getWeekendDefaults().durationHours).toBe(3);
  });
});
