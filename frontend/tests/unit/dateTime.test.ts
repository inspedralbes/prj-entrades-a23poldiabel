import { describe, expect, it } from 'vitest';
import { toBackendDatetime, toInputDatetime } from '../../src/utils/dateTime';

describe('dateTime utils', () => {
  it('formats backend datetime to input format', () => {
    const result = toInputDatetime('2026-04-14 10:30:00');
    expect(result).toBe('2026-04-14T10:30');
  });

  it('returns empty string for invalid input datetime', () => {
    expect(toInputDatetime('not-a-date')).toBe('');
  });

  it('formats input datetime to backend format', () => {
    const result = toBackendDatetime('2026-04-14T10:30');
    expect(result).toBe('2026-04-14 10:30:00');
  });

  it('returns empty string for empty input', () => {
    expect(toBackendDatetime('')).toBe('');
  });
});
