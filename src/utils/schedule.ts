type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const REV_DOW_MAP: Record<string, Day> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

const parseOffsetToMinutes = (offset: string): number => {
  const m = offset.match(/^([+-])(\d{2}):([0-5]\d)$/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
};

const getZonedNowMs = (nowUtc: number, offsetMin: number): number =>
  nowUtc + offsetMin * 60_000;

const zonedWallClockToUtcMs = (
  year: number, month: number, day: number,
  hh: number, mm: number,
  offsetMin: number
): number => {
  const zonedMidnightMs = Date.UTC(year, month, day, 0, 0, 0, 0); // use UTC parts on shifted time
  const zonedCandidateMs = zonedMidnightMs + hh * 3_600_000 + mm * 60_000;
  // convert back from zoned to UTC by subtracting the offset
  return zonedCandidateMs - offsetMin * 60_000;
};

export const formatCountdown = (diffMs: number): string => {
  if (diffMs < 0) diffMs = 0;
  const total = Math.floor(diffMs / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const parseQuartz = (expr: string): { hh: number; mm: number; days: Day[] } | null => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 6 || parts[0] !== '0') return null;
  const mm = parseInt(parts[1] ?? '', 10);
  const hh = parseInt(parts[2] ?? '', 10);
  if (Number.isNaN(mm) || Number.isNaN(hh)) return null;

  const dows = (parts[5] ?? '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .map(s => REV_DOW_MAP[s])
    .filter(Boolean) as Day[];

  return { hh, mm, days: dows };
};


export const nextUtcForQuartz = (
  expr: string,
  zoneOffset: string,
  nowUtc = Date.now()
): number | null => {
  const parsed = parseQuartz(expr);
  if (!parsed || parsed.days.length === 0) return null;

  const offsetMin = parseOffsetToMinutes(zoneOffset);

  // "now" in the model zone
  const zonedNowMs = getZonedNowMs(nowUtc, offsetMin);
  const z = new Date(zonedNowMs);
  const zYear = z.getUTCFullYear();
  const zMonth = z.getUTCMonth();
  const zDate = z.getUTCDate();
  const zDow = z.getUTCDay(); // 0..6 Sun..Sat in the model zone
  const nowMinutes = z.getUTCHours() * 60 + z.getUTCMinutes();

  const DAY_TO_IDX: Record<Day, number> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

  let best: number | null = null;

  for (const d of parsed.days) {
    const targetIdx = DAY_TO_IDX[d];
    let deltaDays = (targetIdx - zDow + 7) % 7;

    // if it's the same day but the target time has already passed in the zone, push to next week
    const targetMinutes = parsed.hh * 60 + parsed.mm;
    if (deltaDays === 0 && targetMinutes <= nowMinutes) {
      deltaDays = 7;
    }

    // construct the candidate in the model zone, then convert to UTC ms
    const candUtc = zonedWallClockToUtcMs(
      zYear, zMonth, zDate + deltaDays, parsed.hh, parsed.mm, offsetMin
    );

    if (best === null || candUtc < best) best = candUtc;
  }

  return best;
};


export const getNextRunInfo = (
  cronList: string[],
  zoneOffset: string,
  nowUtc = Date.now(),
) => {
  let best: number | null = null;
  for (const c of cronList) {
    const n = nextUtcForQuartz(c, zoneOffset, nowUtc);

    if (typeof n === 'number' && (best === null || n < best)) best = n;

  }
  if (best === null) return { nextUtc: null as number | null, countdown: '--:--:--' };
  return { nextUtc: best, countdown: formatCountdown(best - nowUtc) };
};
