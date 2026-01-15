// utils/dateHelpers.ts
import moment from "moment-timezone";

/**
 * Convert epoch time to formatted string in a specific timezone
 * @param epoch - timestamp in seconds or milliseconds
 * @param tz - timezone string (e.g., "Asia/Yangon")
 * @param format - output format, default "YYYY-MM-DDTHH:mm:ssZ"
 */
export const formatEpochToTZ = (
    epoch: number,
    tz?: string,
    format = "YYYY-MM-DDTHH:mm:ssZ"
): string => {
    if (!epoch) return "-";

    let m;

    // Determine if epoch is in seconds or milliseconds
    m = epoch.toString().length === 10 ? moment.unix(epoch) : moment(epoch);

    // Apply timezone if provided
    if (tz) {
        m = m.tz(tz);
    }

    return m.format(format);
};

export const getOffsetForZone = (timeZone: string): string => {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
        hour: '2-digit', minute: '2-digit',
    });
    const off = fmt.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? '';
    const m = off.replace('GMT', '').replace('UTC', '').match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
    const sign = m?.[1] ?? '+', hh = String(Number(m?.[2] ?? '0')).padStart(2, '0'), mm = String(m?.[3] ?? '00').padStart(2, '0');
    return `${sign}${hh}${mm}`;
};