const toNumber = (value: unknown, fallback: number) => {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
};

// Readable variables first (Vite envs are strings)
const JOB_TTL_MIN = toNumber(import.meta.env.VITE_JOB_TTL_MIN, 15);
const READY_TTL_HOURS = toNumber(import.meta.env.VITE_READY_TTL_HOURS, 24);
const POLL_INTERVAL_SEC = toNumber(import.meta.env.VITE_POLL_INTERVAL_SEC, 30);

// Convert to milliseconds
export const REPORT_DOWNLOAD_CONFIG = {
  JOB_TTL_MIN,
  READY_TTL_HOURS,
  POLL_INTERVAL_SEC,
  JOB_TTL_MS: JOB_TTL_MIN * 60 * 1000,
  READY_TTL_MS: READY_TTL_HOURS * 60 * 60 * 1000,
  POLL_INTERVAL_MS: POLL_INTERVAL_SEC * 1000,
};

