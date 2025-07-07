import moment from 'moment-timezone'

const defaultValue = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const defaultOption = { value: defaultValue, label: moment?.tz(defaultValue).format('([GMT]Z)') + ' Local Timezone' };
