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

import { toDateOnly, toDateString, isAfterToday } from '../lib/date.js';
import { recordAttendanceSchema } from '../controllers/attendance.controller.js';

describe('toDateOnly & Date normalization safeguards', () => {
  it('should normalize YYYY-MM-DD string to UTC midnight', () => {
    const d = toDateOnly('2026-08-27');
    expect(d.toISOString()).toBe('2026-08-27T00:00:00.000Z');
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it('should normalize ISO timestamp with time offset to UTC midnight date', () => {
    const d = toDateOnly('2026-08-27T18:45:30.500Z');
    expect(d.toISOString()).toBe('2026-08-27T00:00:00.000Z');
  });

  it('should format date string correctly with toDateString', () => {
    const str = toDateString(new Date('2026-08-27T15:30:00Z'));
    expect(str).toBe('2026-08-27');
  });

  it('should accurately detect future dates with isAfterToday', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(isAfterToday(futureDate)).toBe(true);

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    expect(isAfterToday(pastDate)).toBe(false);

    const today = new Date();
    expect(isAfterToday(today)).toBe(false);
  });
});

describe('Attendance request body Zod schema safeguards', () => {
  it('should reject when checkOut is earlier than or equal to checkIn', () => {
    const payload = {
      employeeId: 1,
      date: '2026-08-20',
      checkIn: '2026-08-20T17:00:00.000Z',
      checkOut: '2026-08-20T09:00:00.000Z', // earlier than checkIn
    };
    const result = recordAttendanceSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join('; ');
      expect(msg).toContain('checkOut time must be later than checkIn time');
    }
  });

  it('should accept valid checkIn and later checkOut', () => {
    const payload = {
      employeeId: 1,
      date: '2026-08-20',
      checkIn: '2026-08-20T07:00:00.000Z',
      checkOut: '2026-08-20T15:30:00.000Z',
    };
    const result = recordAttendanceSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject future attendance records when status is not ON_LEAVE', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureDateStr = future.toISOString().split('T')[0];

    const payload = {
      employeeId: 1,
      date: futureDateStr,
      status: 'PRESENT',
    };
    const result = recordAttendanceSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join('; ');
      expect(msg).toContain('Attendance records dated after today are not permitted unless status is ON_LEAVE');
    }
  });

  it('should permit future attendance records when status is ON_LEAVE (planned leave)', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const futureDateStr = future.toISOString().split('T')[0];

    const payload = {
      employeeId: 1,
      date: futureDateStr,
      status: 'ON_LEAVE',
    };
    const result = recordAttendanceSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
