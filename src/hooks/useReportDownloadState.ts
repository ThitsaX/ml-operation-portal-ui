import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getReportDownloadStatus, getReportDownloadUrlCloud } from '@services/report';
import { useGetUserState } from '@store/hooks';
import moment from 'moment';
import { IApiErrorResponse } from '@typescript/services';
import { REPORT_DOWNLOAD_CONFIG } from '@configs/report-download';

export type DownloadStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'READY';

export interface ReadyFile {
  url: string;
  fileName: string;
}

export interface UseReportDownloadStateOptions {
  jobTtlMs?: number;
  readyTtlMs?: number;
  pollIntervalMs?: number;
}

interface PersistedDownloadState {
  requestId: string;
  status: Exclude<DownloadStatus, 'IDLE'>;
  fileType: string;
  startedAt: number;   // epoch ms — used for 15min job TTL
  fileUrl?: string;
  fileName?: string;
  urlFetchedAt?: number; // epoch ms — used for 24-h URL expiry check
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


// ⏱ Polling runs max 15 minutes
const DEFAULT_JOB_TTL_MS = REPORT_DOWNLOAD_CONFIG.JOB_TTL_MS;

// ⏱ S3 URL valid for 24 hours
const DEFAULT_READY_TTL_MS = REPORT_DOWNLOAD_CONFIG.READY_TTL_MS;

// ⏱ Poll every 30 seconds (fixed interval)
const DEFAULT_POLL_INTERVAL_MS = REPORT_DOWNLOAD_CONFIG.POLL_INTERVAL_MS;

// Pure helper — safe to call outside React render
function computeInitialState(storageKey: string, jobTtlMs: number, readyTtlMs: number): {
  status: DownloadStatus;
  readyFile: ReadyFile | null;
} {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { status: 'IDLE', readyFile: null };

    const stored: PersistedDownloadState = JSON.parse(raw);

    if (stored.status === 'READY' && stored.fileUrl && stored.fileName) {
      const readySince = stored.urlFetchedAt ?? stored.startedAt;
      if (Date.now() - readySince <= readyTtlMs) {
        return {
          status: 'READY',
          readyFile: { url: stored.fileUrl, fileName: stored.fileName },
        };
      }
      localStorage.removeItem(storageKey);
      return { status: 'IDLE', readyFile: null };
    }

    if (stored.status === 'PENDING' || stored.status === 'RUNNING') {
      if (Date.now() - stored.startedAt > jobTtlMs) {
        localStorage.removeItem(storageKey);
        return { status: 'IDLE', readyFile: null };
      }
    }

    return { status: stored.status as DownloadStatus, readyFile: null };
  } catch {
    return { status: 'IDLE', readyFile: null };
  }
}

export function useReportDownloadState(
  reportName: string,
  onDownloadReady: (fileName: string) => void,
  onError: (message: IApiErrorResponse) => void,
  options?: UseReportDownloadStateOptions
): UseReportDownloadStateReturn {
  const user = useGetUserState();
  const userId = user?.data?.userId as string | undefined;
  const storageKey = useMemo(
    () =>
      typeof userId === 'string' && userId.length > 0
        ? `${STORAGE_KEY_PREFIX}${userId}:${reportName}`
        : '',
    [userId, reportName]
  );

  const jobTtlMs = options?.jobTtlMs ?? DEFAULT_JOB_TTL_MS;
  const readyTtlMs = options?.readyTtlMs ?? DEFAULT_READY_TTL_MS;
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  // Keep latest values without re-triggering effects on every render.
  const userRef = useRef(user);
  const reportNameRef = useRef(reportName);
  const onErrorRef = useRef(onError);
  const onDownloadReadyRef = useRef(onDownloadReady);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    reportNameRef.current = reportName;
  }, [reportName]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onDownloadReadyRef.current = onDownloadReady;
  }, [onDownloadReady]);


  // Read localStorage once at mount — avoids IDLE → RUNNING flicker
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('IDLE');
  const [readyFile, setReadyFile] = useState<ReadyFile | null>(null);

  // Each polling session owns its abort token; the previous session is cancelled
  // before a new one starts or when the component unmounts.
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const prevStorageKeyRef = useRef<string>('');

  const readStorage = useCallback((): PersistedDownloadState | null => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as PersistedDownloadState) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const writeStorage = useCallback(
    (patch: Partial<PersistedDownloadState>) => {
      if (!storageKey) return;
      const existing = readStorage();
      if (!existing) return;
      localStorage.setItem(storageKey, JSON.stringify({ ...existing, ...patch }));
    },
    [storageKey, readStorage]
  );

  const clearStorage = useCallback(() => {
    if (!storageKey) return;
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
  const consumeDownload = useCallback(async () => {
    if (!readyFile) return;

    const triggerDownload = (blob: Blob, fileName: string) => {
      const objUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 0);
    };

    const downloadBlob = async (url: string) => {
      const resp = await fetch(url);
      if (!resp.ok && resp.status== 403) throw new Error(`The download link has expired. Please generate the report again.`);
      return resp.blob();
    };

    try {
      const blob = await downloadBlob(readyFile.url);
      triggerDownload(blob, readyFile.fileName);
      clearStorage();
      setDownloadStatus('IDLE');
      setReadyFile(null);
      return;
    } catch(err: any) {
        onErrorRef.current({
          description: err?.message || 'Download link expired. Please try again.',
          default_error_message: '',
          error_code: '',
        });
      
    }
  }, [readyFile, clearStorage, readStorage, writeStorage]);

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

      const startTime = readStorage()?.startedAt ?? Date.now();
      while (!abort.aborted) {
        let statusRes: any;

        if (Date.now() - startTime > jobTtlMs) {
          clearStorage();
          setDownloadStatus('IDLE');
          onErrorRef.current({ description: 'Report is taking too long. Please try again.', default_error_message: '', error_code: '' });
          return;
        }

        try {
          statusRes = await getReportDownloadStatus(userRef.current as any, requestId);
        } catch (err: any) {
          if (abort.aborted) return;
          onErrorRef.current({ description: err?.message || 'Failed to check report status', default_error_message: '', error_code: '' });
          clearStorage();
          setDownloadStatus('IDLE');
          return;
        }

        if (abort.aborted) return;

        const rawStatus = String(statusRes?.status ?? '').toUpperCase();

        if (rawStatus === '' || rawStatus === 'PENDING') {
          setDownloadStatus('PENDING');
          writeStorage({ status: 'PENDING' });
          // await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          await delay(pollIntervalMs);
          attempt++;
          await waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'RUNNING') {
          setDownloadStatus('RUNNING');
          writeStorage({ status: 'RUNNING' });
          // await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          await delay(pollIntervalMs);
          attempt++;
          await waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'FAILED') {
          try {
            const urlRes = await getReportDownloadUrlCloud(userRef.current as any, { requestId });
          } catch (err: any) {
            if (abort.aborted) return;
            clearStorage();
            setDownloadStatus('IDLE');
            onErrorRef.current(err);
            return;
          }
        }

        if (rawStatus === 'READY') {
          let urlRes: any;
          try {
            urlRes = await getReportDownloadUrlCloud(userRef.current as any, { requestId });
          } catch (err: any) {
            if (abort.aborted) return;
            clearStorage();
            setDownloadStatus('IDLE');
            onErrorRef.current({ description: 'Failed to retrieve download URL', default_error_message: '', error_code: '' });
            return;
          }

          if (abort.aborted) return;

          const url: string = urlRes?.fileUrl ?? '';
          if (!url) {
            clearStorage();
            setDownloadStatus('IDLE');
            onErrorRef.current({ description: 'Download URL was empty', default_error_message: '', error_code: '' });
            return;
          }

          const keyBasedName =
            typeof urlRes?.fileKey === 'string' && urlRes.fileKey.length > 0
              ? urlRes.fileKey.split('/').pop()
              : null;
          const fileName =
            keyBasedName || `${reportNameRef.current}-${moment().format('DDMMMYYYY')}.${fileType}`;

          // Persist the URL so it survives navigation within the 14-min window
          writeStorage({ status: 'READY', fileUrl: url, fileName, urlFetchedAt: Date.now() });

          const file: ReadyFile = { url, fileName };
          setReadyFile(file);
          setDownloadStatus('READY');
          onDownloadReadyRef.current(fileName);
          return;
        }

        clearStorage();
        setDownloadStatus('IDLE');
        onErrorRef.current({ description: `Unexpected report status: "${rawStatus || '(empty)'}`, default_error_message: '', error_code: '' });
        return;
      }
    },
    [readStorage, clearStorage, writeStorage, waitForVisible, jobTtlMs, pollIntervalMs]
  );

  // Hydrate from user-scoped localStorage and resume polling if needed.
  // This also resets correctly on logout/login (userId change).
  useEffect(() => {
    // Stop any prior polling session.
    abortRef.current.aborted = true;

    // If we just logged out (lost userId), clear the previous user's persisted state
    // so the next login doesn't incorrectly show "loading" from a past session.
    const prevStorageKey = prevStorageKeyRef.current;
    prevStorageKeyRef.current = storageKey;
    if (!storageKey) {
      if (prevStorageKey) localStorage.removeItem(prevStorageKey);
      setDownloadStatus('IDLE');
      setReadyFile(null);
      return;
    }

    const initial = computeInitialState(storageKey, jobTtlMs, readyTtlMs);
    setDownloadStatus(initial.status);
    setReadyFile(initial.readyFile);

    const stored = readStorage();
    if (!stored) return;

    if (stored.status === 'PENDING' || stored.status === 'RUNNING') {
      const abort = { aborted: false };
      abortRef.current = abort;
      void runPollLoop(stored.requestId, stored.fileType, abort);
      return () => {
        abort.aborted = true;
      };
    }

    return () => {
      abortRef.current.aborted = true;
    };
  }, [storageKey, readStorage, runPollLoop, jobTtlMs, readyTtlMs]);

  const startPolling = useCallback((requestId: string, fileType: string) => {
    abortRef.current.aborted = true;
    if (!storageKey) {
      setDownloadStatus('IDLE');
      setReadyFile(null);
      onErrorRef.current({ description: 'User profile not ready. Please try again.', default_error_message: '', error_code: '' });
      return;
    }
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
