import {
  formatToISO,
  formatToLocale,
  formatDateTimeToLocale,
  parseDate,
  addDays,
  addHours,
  addMinutes,
  isToday,
  isYesterday,
  isWithinLastDays,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getRelativeTime,
  getDifferenceInDays,
  getDifferenceInHours,
  getDifferenceInMinutes,
  formatDuration,
  getTimezoneOffset,
  utcToLocal,
  localToUtc,
  isLeapYear,
  getDaysInMonth,
  createDateRange
} from '../../src/utils/dateUtils';

describe('Date Utils', () => {
  describe('formatToISO', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatToISO(date);
      expect(result).toBe('2023-12-25T10:30:00.000Z');
    });
  });

  describe('formatToLocale', () => {
    it('should format date to locale string', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = formatToLocale(date, 'en-US');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/12\/25\/2023/);
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date string', () => {
      const dateString = '2023-12-25T10:30:00Z';
      const result = parseDate(dateString);
      expect(result).toEqual(new Date(dateString));
    });

    it('should return null for invalid date string', () => {
      const result = parseDate('invalid-date');
      expect(result).toBeNull();
    });

    it('should parse common date formats', () => {
      const result1 = parseDate('2023-12-25');
      expect(result1).toBeTruthy();
      
      const result2 = parseDate('12/25/2023');
      expect(result2).toBeTruthy();
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2023-12-25');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(30);
      expect(result.getMonth()).toBe(11); // December
    });

    it('should handle month overflow', () => {
      const date = new Date('2023-12-28');
      const result = addDays(date, 10);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(7);
    });
  });

  describe('addHours', () => {
    it('should add hours correctly', () => {
      const date = new Date('2023-12-25T10:00:00Z');
      const result = addHours(date, 5);
      expect(result.getUTCHours()).toBe(15); // Use UTC hours
    });

    it('should handle day overflow', () => {
      const date = new Date('2023-12-25T22:00:00Z');
      const result = addHours(date, 5);
      expect(result.getUTCDate()).toBe(26);
      expect(result.getUTCHours()).toBe(3);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const result = addMinutes(date, 45);
      expect(result.getUTCMinutes()).toBe(15);
      expect(result.getUTCHours()).toBe(11);
    });
  });

  describe('getDifferenceInDays', () => {
    it('should calculate days between dates', () => {
      const date1 = new Date('2023-12-20');
      const date2 = new Date('2023-12-25');
      expect(getDifferenceInDays(date1, date2)).toBe(5);
    });

    it('should handle reverse order', () => {
      const date1 = new Date('2023-12-25');
      const date2 = new Date('2023-12-20');
      expect(getDifferenceInDays(date1, date2)).toBe(5);
    });

    it('should return 0 for same date', () => {
      const date = new Date('2023-12-25');
      expect(getDifferenceInDays(date, date)).toBe(0);
    });
  });

  describe('isToday', () => {
    it('should detect today correctly', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should reject yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should detect yesterday correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });

    it('should reject today', () => {
      const today = new Date();
      expect(isYesterday(today)).toBe(false);
    });
  });

  describe('getStartOfDay', () => {
    it('should set time to start of day', () => {
      const date = new Date('2023-12-25T15:30:45');
      const result = getStartOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('getEndOfDay', () => {
    it('should set time to end of day', () => {
      const date = new Date('2023-12-25T15:30:45');
      const result = getEndOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('getRelativeTime', () => {
    it('should format relative time for past', () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const result = getRelativeTime(hourAgo);
      expect(result).toBe('1 hour ago');
    });

    it('should handle just now', () => {
      const now = new Date();
      const result = getRelativeTime(now);
      expect(result).toBe('just now');
    });

    it('should handle minutes', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const result = getRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5 minutes ago');
    });
  });

  describe('getStartOfWeek', () => {
    it('should get Monday as start of week', () => {
      const wednesday = new Date('2023-12-27'); // Known Wednesday
      const startOfWeek = getStartOfWeek(wednesday);
      expect(startOfWeek.getDay()).toBe(1); // Monday
    });
  });

  describe('formatDuration', () => {
    it('should format duration in milliseconds', () => {
      expect(formatDuration(45000)).toBe('45 seconds');
      expect(formatDuration(1000)).toBe('1 second');
    });

    it('should format duration in minutes', () => {
      expect(formatDuration(120000)).toBe('2 minutes');
      expect(formatDuration(60000)).toBe('1 minute');
    });

    it('should format duration in hours', () => {
      expect(formatDuration(3600000)).toBe('1 hour');
      expect(formatDuration(7200000)).toBe('2 hours');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0 seconds');
    });
  });

  describe('isWithinLastDays', () => {
    it('should detect dates within specified days', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      
      expect(isWithinLastDays(twoDaysAgo, 3)).toBe(true);
      expect(isWithinLastDays(twoDaysAgo, 1)).toBe(false);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return timezone offset', () => {
      const date = new Date();
      const offset = getTimezoneOffset(date);
      expect(typeof offset).toBe('number');
    });
  });

  describe('utcToLocal and localToUtc', () => {
    it('should convert between UTC and local time', () => {
      const utcDate = new Date('2023-12-25T12:00:00Z');
      const localDate = utcToLocal(utcDate);
      const backToUtc = localToUtc(localDate);
      
      expect(backToUtc.getTime()).toBeCloseTo(utcDate.getTime(), -3);
    });
  });

  describe('isLeapYear', () => {
    it('should detect leap years', () => {
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('should get correct days in month', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28); // February non-leap
      expect(getDaysInMonth(2020, 2)).toBe(29); // February leap
      expect(getDaysInMonth(2023, 4)).toBe(30); // April
      expect(getDaysInMonth(2023, 12)).toBe(31); // December
    });
  });

  describe('createDateRange', () => {
    it('should create date range', () => {
      const start = new Date('2023-12-25');
      const end = new Date('2023-12-27');
      const range = createDateRange(start, end);
      
      expect(range).toHaveLength(3);
      expect(range[0]).toEqual(start);
      expect(range[2]).toEqual(end);
    });
  });
});