import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/** USD currency. Pass a higher `maximumFractionDigits` for tiny AWS line-item costs. */
export const formatCurrency = (value: number, maximumFractionDigits = 2): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);

/** Compact currency for chart axis labels, e.g. "$1.2k" instead of "$1,234.56". */
export const formatCompactCurrency = (value: number): string =>
  Math.abs(value) >= 1000 ? `$${(value / 1000).toFixed(1)}k` : formatCurrency(value);

/** Human-readable file size (B / KB / MB). */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Short date + time, e.g. "Aug 27, 2026, 02:15 PM". */
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Long date only, e.g. "August 27, 2026". */
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

/** Relative time, e.g. "3 hours ago". */
export const formatRelativeTime = (iso: string): string => dayjs(iso).fromNow();
