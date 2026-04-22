import { describe, it, expect } from 'vitest';
import { getDailyData, getAvailableDates } from '@/lib/data';

describe('getDailyData', () => {
  it('returns null for non-existent date', () => {
    const result = getDailyData('2099-01-01');
    expect(result).toBeNull();
  });
});

describe('getAvailableDates', () => {
  it('returns an array of date strings', () => {
    const dates = getAvailableDates();
    expect(Array.isArray(dates)).toBe(true);
    expect(dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
  });
});
