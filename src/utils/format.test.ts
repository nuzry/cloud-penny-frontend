import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, formatFileSize, formatDateTime, formatDate, formatRelativeTime } from './format';

describe('formatCurrency', () => {
  it('formats a whole dollar amount', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('respects a higher maximumFractionDigits for tiny AWS line items', () => {
    expect(formatCurrency(0.000123, 6)).toBe('$0.000123');
  });
});

describe('formatCompactCurrency', () => {
  it('uses the "$X.Xk" compact form at or above 1000', () => {
    expect(formatCompactCurrency(1234)).toBe('$1.2k');
  });

  it('falls back to normal currency formatting below 1000', () => {
    expect(formatCompactCurrency(42)).toBe('$42.00');
  });

  it('handles negative values by magnitude, not sign', () => {
    expect(formatCompactCurrency(-2000)).toBe('$-2.0k');
  });
});

describe('formatFileSize', () => {
  it('formats bytes under 1KB as-is', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatDateTime / formatDate', () => {
  it('formats an ISO string as a short date + time', () => {
    expect(formatDateTime('2026-08-27T14:15:00Z')).toContain('2026');
  });

  it('formats an ISO string as a long date', () => {
    expect(formatDate('2026-08-27T14:15:00Z')).toContain('August');
  });
});

describe('formatRelativeTime', () => {
  it('describes a moment in the recent past as "a few seconds ago"', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toMatch(/a few seconds ago|now/i);
  });
});
