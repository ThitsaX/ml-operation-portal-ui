import moment from 'moment-timezone'

const DEFAULT_TIMEZONE = 'Etc/GMT';

export const FALLBACK_TIMEZONE = {
  value: DEFAULT_TIMEZONE,
  label: '(GMT+00:00) UTC'
}

function resolveSystemTimezone(): string {
  const systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!systemTZ || systemTZ === 'UTC') {
    return DEFAULT_TIMEZONE;
  }

  return systemTZ && moment.tz.zone(systemTZ)
    ? systemTZ
    : DEFAULT_TIMEZONE;
}

const defaultTimezone = resolveSystemTimezone();
const tzMoment = moment.tz(defaultTimezone);

export const defaultOption = {
  value: defaultTimezone,
  label: `(GMT${tzMoment.format('Z')}) ${defaultTimezone}`,
};


export const WINDOW_STATE_OPTIONS = [
    "OPEN", "CLOSED", "PENDING_SETTLEMENT", "SETTLED"
] as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((size) => ({
  value: size.toString(),
  label: size.toString(),
}));