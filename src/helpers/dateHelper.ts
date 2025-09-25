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
