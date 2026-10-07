import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy', { locale: id });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy HH:mm', { locale: id });
}

export function formatInvoiceDate(): string {
  return format(new Date(), 'yyyyMMdd');
}
