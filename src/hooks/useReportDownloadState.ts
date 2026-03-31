import { useState, useEffect, useCallback, useRef } from 'react';
import { getReportDownloadStatus, getReportDownloadUrlCloud } from '@services/report';
import { useGetUserState } from '@store/hooks';
import moment from 'moment';

export type DownloadStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'READY';

export interface ReadyFile {
  url: string;
  fileName: string;
}

interface PersistedDownloadState {
  requestId: string;
  status: Exclude<DownloadStatus, 'IDLE'>;
  fileType: string;
  startedAt: number;   // epoch ms — used for 4h job TTL
  // Populated once the report reaches READY
  fileUrl?: string;
  fileName?: string;
  urlFetchedAt?: number; // epoch ms — used for 14-min URL expiry check
}

interface UseReportDownloadStateReturn {
  downloadStatus: DownloadStatus;
  isDownloading: boolean;
  readyFile: ReadyFile | null;
  startPolling: (requestId: string, fileType: string) => void;
  consumeDownload: () => void;
  clearDownloadState: () => void;
}

const STORAGE_KEY_PREFIX = 'report_download:';
const JOB_TTL_MS  = 4 * 60 * 60 * 1000;  // 4 h  — backend jobs never run this long
const URL_TTL_MS  = 14 * 60 * 1000;       // 14 min — S3 pre-signed URL expires at 15 min
const POLL_INITIAL_MS = 2_000;
const POLL_MAX_MS     = 30_000;

// Pure helper — safe to call outside React render
function computeInitialState(storageKey: string): {
  status: DownloadStatus;
  readyFile: ReadyFile | null;
} {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { status: 'IDLE', readyFile: null };

    const stored: PersistedDownloadState = JSON.parse(raw);

    if (Date.now() - stored.startedAt > JOB_TTL_MS) {
      localStorage.removeItem(storageKey);
      return { status: 'IDLE', readyFile: null };
    }

    if (
      stored.status === 'READY' &&
      stored.fileUrl &&
      stored.fileName &&
      stored.urlFetchedAt
    ) {
      if (Date.now() - stored.urlFetchedAt <= URL_TTL_MS) {
        return {
          status: 'READY',
          readyFile: { url: stored.fileUrl, fileName: stored.fileName },
        };
      }
      // URL expired — clear and let the user re-request
      localStorage.removeItem(storageKey);
      return { status: 'IDLE', readyFile: null };
    }

    return { status: stored.status as DownloadStatus, readyFile: null };
  } catch {
    return { status: 'IDLE', readyFile: null };
  }
}

export function useReportDownloadState(
  reportName: string,
  onDownloadReady: (fileName: string) => void,
  onError: (message: string) => void
): UseReportDownloadStateReturn {
  const storageKey = `${STORAGE_KEY_PREFIX}${reportName}`;
  const user = useGetUserState();

  // Read localStorage once at mount — avoids IDLE → RUNNING flicker
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>(
    () => computeInitialState(storageKey).status
  );
  const [readyFile, setReadyFile] = useState<ReadyFile | null>(
    () => computeInitialState(storageKey).readyFile
  );

  // Each polling session owns its abort token; the previous session is cancelled
  // before a new one starts or when the component unmounts.
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });

  const readStorage = useCallback((): PersistedDownloadState | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as PersistedDownloadState) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeStorage = useCallback(
    (patch: Partial<PersistedDownloadState>) => {
      const existing = readStorage();
      if (!existing) return;
      localStorage.setItem(storageKey, JSON.stringify({ ...existing, ...patch }));
    },
    [storageKey, readStorage]
  );

  const clearStorage = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const clearDownloadState = useCallback(() => {
    abortRef.current.aborted = true;
    clearStorage();
    setDownloadStatus('IDLE');
    setReadyFile(null);
  }, [clearStorage]);

  // Called by the user clicking the download link — browser allows the download
  // because it originates from a direct user gesture.
  const consumeDownload = useCallback(() => {
    if (!readyFile) return;
    const link = document.createElement('a');
    link.href = readyFile.url;
    link.download = readyFile.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
    clearStorage();
    setDownloadStatus('IDLE');
    setReadyFile(null);
  }, [readyFile, clearStorage]);

  // Resolves immediately when the tab is visible; suspends the loop while hidden.
  const waitForVisible = useCallback(
    (abort: { aborted: boolean }) =>
      new Promise<void>((resolve) => {
        if (!document.hidden || abort.aborted) { resolve(); return; }
        const handler = () => {
          if (!document.hidden || abort.aborted) {
            document.removeEventListener('visibilitychange', handler);
            resolve();
          }
        };
        document.addEventListener('visibilitychange', handler);
      }),
    []
  );

  const runPollLoop = useCallback(
    async (requestId: string, fileType: string, abort: { aborted: boolean }) => {
      const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      let attempt = 0;

      while (!abort.aborted) {
        let statusRes: any;
        try {
          statusRes = await getReportDownloadStatus(user as any, requestId);
        } catch (err: any) {
          if (abort.aborted) return;
          onError(err?.message || 'Failed to check report status');
          clearStorage();
          setDownloadStatus('IDLE');
          return;
        }

        if (abort.aborted) return;

        const rawStatus = String(statusRes?.status ?? '').toUpperCase();

        if (rawStatus === '' || rawStatus === 'PENDING') {
          setDownloadStatus('PENDING');
          writeStorage({ status: 'PENDING' });
          await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          attempt++;
          await waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'RUNNING') {
          setDownloadStatus('RUNNING');
          writeStorage({ status: 'RUNNING' });
          await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          attempt++;
          await waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'FAILED') {
          clearStorage();
          setDownloadStatus('IDLE');
          onError(statusRes?.message || 'Report generation failed');
          return;
        }

        if (rawStatus === 'READY') {
          let urlRes: any;
          try {
            urlRes = await getReportDownloadUrlCloud(user as any, { requestId });
          } catch (err: any) {
            if (abort.aborted) return;
            clearStorage();
            setDownloadStatus('IDLE');
            onError('Failed to retrieve download URL');
            return;
          }

          if (abort.aborted) return;

          const url: string = urlRes?.fileUrl ?? '';
          if (!url) {
            clearStorage();
            setDownloadStatus('IDLE');
            onError('Download URL was empty');
            return;
          }

          const keyBasedName =
            typeof urlRes?.fileKey === 'string' && urlRes.fileKey.length > 0
              ? urlRes.fileKey.split('/').pop()
              : null;
          const fileName =
            keyBasedName || `${reportName}-${moment().format('DDMMMYYYY')}.${fileType}`;

          // Persist the URL so it survives navigation within the 14-min window
          writeStorage({ status: 'READY', fileUrl: url, fileName, urlFetchedAt: Date.now() });

          const file: ReadyFile = { url, fileName };
          setReadyFile(file);
          setDownloadStatus('READY');
          onDownloadReady(fileName);
          return;
        }

        clearStorage();
        setDownloadStatus('IDLE');
        onError(`Unexpected report status: "${rawStatus || '(empty)'}"`);
        return;
      }
    },
    [user, onError, onDownloadReady, clearStorage, writeStorage, waitForVisible, reportName]
  );

  // On mount: resume polling if job is still in-flight; restore link if READY
  useEffect(() => {
    const stored = readStorage();
    if (!stored) return;

    const isStale = Date.now() - stored.startedAt > JOB_TTL_MS;
    if (isStale) {
      clearStorage();
      setDownloadStatus('IDLE');
      setReadyFile(null);
      return;
    }

    if (stored.status === 'PENDING' || stored.status === 'RUNNING') {
      const abort = { aborted: false };
      abortRef.current = abort;
      void runPollLoop(stored.requestId, stored.fileType, abort);
    }
    // READY: initial useState already restored readyFile — no polling needed

    return () => {
      // Unmount: stop polling, keep localStorage so next mount can resume
      abortRef.current.aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally once on mount

  const startPolling = useCallback((requestId: string, fileType: string) => {
    abortRef.current.aborted = true;
    const abort = { aborted: false };
    abortRef.current = abort;
    const state: PersistedDownloadState = {
      requestId,
      fileType,
      status: 'PENDING',
      startedAt: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
    setDownloadStatus('PENDING');
    setReadyFile(null);
    void runPollLoop(requestId, fileType, abort);
  }, [storageKey, runPollLoop]);

  const isDownloading = downloadStatus === 'PENDING' || downloadStatus === 'RUNNING';

  return { downloadStatus, isDownloading, readyFile, startPolling, consumeDownload, clearDownloadState };
}
