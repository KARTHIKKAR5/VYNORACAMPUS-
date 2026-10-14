import { getApiBase } from '../../services/api'
import type { TimetableCurrentSnapshot, TimetableSnapshot } from './types'

export type TimetableBatchOption = {
  degree: string;
  program: string;
  year: string;
  batch: string;
  academicYear?: string;
  sruBatchCode?: string;
}

export type TimetableOptionsResponse = {
  options: TimetableBatchOption[];
  tree?: Record<string, Record<string, string[]>>;
}

const api = async <T>(path: string): Promise<T> => {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const response = await fetch(`${base}/timetable/${cleanPath}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error('Unable to load timetable');
  return response.json();
}

export const timetableApi = {
  today: (batch?: string) => api<TimetableSnapshot>(batch ? `today?batch=${encodeURIComponent(batch)}` : 'today'),
  week: (batch?: string) => api<TimetableSnapshot>(batch ? `week?batch=${encodeURIComponent(batch)}` : 'week'),
  current: (batch?: string) => api<TimetableCurrentSnapshot>(batch ? `current?batch=${encodeURIComponent(batch)}` : 'current'),
  options: () => api<TimetableOptionsResponse>('options')
}

