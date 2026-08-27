import { describe, it, expect } from 'vitest';
import { deriveAttendanceStatus } from './attendance.service.js';

describe('deriveAttendanceStatus business logic', () => {
  const morningShiftStart = '07:00';
  const eveningShiftStart = '15:00';
  const nightShiftStart = '23:00';

  it('should mark PRESENT if checkIn is right on time', () => {
    const checkIn = new Date('2026-08-26T07:00:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
    });
    expect(result).toBe('PRESENT');
  });

  it('should mark PRESENT if checkIn is early', () => {
    const checkIn = new Date('2026-08-26T06:50:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
    });
    expect(result).toBe('PRESENT');
  });

  it('should mark PRESENT if checkIn is within the 10-minute grace period (e.g., 7:08 AM)', () => {
    const checkIn = new Date('2026-08-26T07:08:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
    });
    expect(result).toBe('PRESENT');
  });

  it('should mark PRESENT at exactly 10 minutes past shift start (boundary condition 7:10 AM)', () => {
    const checkIn = new Date('2026-08-26T07:10:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
    });
    expect(result).toBe('PRESENT');
  });

  it('should mark LATE if checkIn is more than 10 minutes after shift start (e.g., 7:11 AM)', () => {
    const checkIn = new Date('2026-08-26T07:11:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
      explicitStatus: 'PRESENT', // overridden by late check-in
    });
    expect(result).toBe('LATE');
  });

  it('should mark LATE for evening shift when checkIn is 15:25 (25 mins late)', () => {
    const checkIn = new Date('2026-08-26T15:25:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: eveningShiftStart,
    });
    expect(result).toBe('LATE');
  });

  it('should handle night shift (23:00) with wrap-around checkIn at 23:15 (LATE)', () => {
    const checkIn = new Date('2026-08-26T23:15:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: nightShiftStart,
    });
    expect(result).toBe('LATE');
  });

  it('should preserve ON_LEAVE even if checkIn is provided', () => {
    const checkIn = new Date('2026-08-26T07:45:00');
    const result = deriveAttendanceStatus({
      checkIn,
      shiftStartTime: morningShiftStart,
      explicitStatus: 'ON_LEAVE',
    });
    expect(result).toBe('ON_LEAVE');
  });

  it('should default to ABSENT when no checkIn is provided and no status specified', () => {
    const result = deriveAttendanceStatus({
      checkIn: null,
      shiftStartTime: morningShiftStart,
    });
    expect(result).toBe('ABSENT');
  });

  it('should return explicit status (e.g., ON_LEAVE) when no checkIn is provided', () => {
    const result = deriveAttendanceStatus({
      checkIn: null,
      shiftStartTime: morningShiftStart,
      explicitStatus: 'ON_LEAVE',
    });
    expect(result).toBe('ON_LEAVE');
  });
});
