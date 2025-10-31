import moment from 'moment-timezone'

const defaultValue = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const defaultOption = { value: defaultValue, label: moment?.tz(defaultValue).format('([GMT]Z)') + ' Local Timezone' };

export const WINDOW_STATE_OPTIONS = [
    "OPEN", "CLOSED", "PENDING_SETTLEMENT", "SETTLED"
] as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50].map((size) => ({
  value: size.toString(),
  label: size.toString(),
}));