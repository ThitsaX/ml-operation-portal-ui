// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import moment from 'moment-timezone';
import {
  type INdcWorkerConfiguration,
  type ISchedulerConfigId
} from '@typescript/services';

export const DEFAULT_WORKER_MINUTES = 5;
export const MAX_WORKER_MINUTES = 60;

export const getConfigId = (
  value?: string | number | ISchedulerConfigId | null
) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object')
    return String(value.id ?? value.entityId ?? '');
  return String(value);
};

export const intervalToMinutes = (
  interval?: string,
  fallback = DEFAULT_WORKER_MINUTES
) => {
  if (!interval) return fallback;

  const cronParts = interval.trim().split(/\s+/);
  if (cronParts.length >= 6) {
    const minutePart = cronParts[1];
    const hourPart = cronParts[2];
    const intervalMinute = minutePart.match(/^(?:\*|0)\/(\d+)$/);
    if (intervalMinute) return Math.max(1, Number(intervalMinute[1]));

    const intervalHour = hourPart.match(/^(?:\*|0)\/(\d+)$/);
    if (intervalHour && minutePart === '0') {
      return Math.max(1, Number(intervalHour[1]) * 60);
    }

    if (hourPart === '*' && minutePart === '0') return 60;
  }

  const parts = interval.split(':').map((part) => Number(part));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return fallback;
  const [hours, minutes, seconds] = parts;
  const totalMinutes = hours * 60 + minutes + Math.ceil(seconds / 60);
  return Math.max(1, totalMinutes);
};

export const normalizeIntervalInput = (value: string) => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return '';
  if (!/^\d+$/.test(trimmedValue)) return trimmedValue;

  return String(Number(trimmedValue));
};

export const minutesToRunEvery = (minutes: number) => {
  const safeMinutes = Math.min(MAX_WORKER_MINUTES, Math.max(1, Math.floor(minutes)));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
};

export const minutesToWorkerDescription = (minutes: number) => {
  const safeMinutes = Math.min(MAX_WORKER_MINUTES, Math.max(1, Math.floor(minutes)));
  return `Executes every ${safeMinutes} ${safeMinutes === 1 ? 'minute' : 'minutes'} to evaluate NDC threshold alerts.`;
};

export const formatTimezoneOffset = (timezone?: string) => {
  if (timezone && moment.tz.zone(timezone)) {
    return moment().tz(timezone).format('Z');
  }

  if (timezone && /^[+-]\d{2}:\d{2}$/.test(timezone)) {
    return timezone;
  }

  if (timezone && /^[+-]\d{4}$/.test(timezone)) {
    return `${timezone.slice(0, 3)}:${timezone.slice(3)}`;
  }

  return '+06:00';
};

export const buildWorkerPayload = (
  worker: INdcWorkerConfiguration | undefined,
  intervalMinutes: number,
  timezone?: string
) => ({
  name: worker?.name || 'ndc-worker-config',
  jobName: worker?.jobName || 'NdcThresholdWorker',
  description: minutesToWorkerDescription(intervalMinutes),
  runEvery: minutesToRunEvery(intervalMinutes),
  zoneId: formatTimezoneOffset(timezone || worker?.zoneId),
  active: worker?.active ?? true
});
