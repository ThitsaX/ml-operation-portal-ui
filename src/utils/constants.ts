import moment from 'moment-timezone'

const defaultValue = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const defaultOption = { value: defaultValue, label: moment?.tz(defaultValue).format('([GMT]Z)') + ' Local Timezone' };

export const WINDOW_STATE_OPTIONS = [
    { label: "OPEN", value: "open" },
    { label: "CLOSED", value: "closed" },
    { label: "PENDING_SETTLEMENT", value: "pending_settlement" },
    { label: "SETTLED", value: "settled" },
] as const;