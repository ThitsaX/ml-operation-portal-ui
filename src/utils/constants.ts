import moment from 'moment-timezone'

const FALLBACK_TIMEZONE = 'UTC';

function resolveSystemTimezone(): string {
  const systemTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return systemTZ && moment.tz.zone(systemTZ)
    ? systemTZ
    : FALLBACK_TIMEZONE;
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