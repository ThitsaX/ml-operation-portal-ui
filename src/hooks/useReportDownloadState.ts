import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getReportDownloadStatus, getReportDownloadUrlCloud } from '@services/report';
import { useGetUserState } from '@store/hooks';
import moment from 'moment';
import { IApiErrorResponse } from '@typescript/services';
import { REPORT_DOWNLOAD_CONFIG } from '@configs/report-download';

export type DownloadStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'READY' | 'FAILED';

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
  failedMessage?: string;
}

interface UseReportDownloadStateReturn {
  downloadStatus: DownloadStatus;
  isDownloading: boolean;
  readyFile: ReadyFile | null;
  failedMessage: string | null;
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

    if (stored.status === 'FAILED') {
      return { status: 'FAILED', readyFile: null };
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
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

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

  const setStorage = useCallback(
    (state: PersistedDownloadState) => {
      if (!storageKey) return;
      localStorage.setItem(storageKey, JSON.stringify(state));
    },
    [storageKey]
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
    setFailedMessage(null);
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
      if (resp.status === 403) {
        const error = new Error('LINK_EXPIRED');
        (error as any).code = 'LINK_EXPIRED';
        throw error;
      }
      if (!resp.ok) {
        throw new Error('DOWNLOAD_FAILED');
      }
      return resp.blob();
    };

    try {
      const blob = await downloadBlob(readyFile.url);
      triggerDownload(blob, readyFile.fileName);
      clearStorage();
      setDownloadStatus('IDLE');
      setReadyFile(null);
      setFailedMessage(null);
      return;
    } catch (err: any) {
      if (err?.code === 'LINK_EXPIRED') {
        onErrorRef.current({
          description: 'The download link has expired. Please generate the report again.',
          default_error_message: '',
          error_code: 'LINK_EXPIRED',
        });
        return;
      }
      onErrorRef.current({
        description: err?.description || 'Failed to download report.',
        default_error_message: '',
        error_code: err?.code || '',
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

  const toApiError = useCallback(
    (description: string, default_error_message = '', error_code = ''): IApiErrorResponse => ({
      description,
      default_error_message,
      error_code
    }),
    []
  );

  const setIdleWithError = useCallback(
    (error?: IApiErrorResponse) => {
      clearStorage();
      setDownloadStatus('IDLE');
      setFailedMessage(null);
      if (error) onErrorRef.current(error);
    },
    [clearStorage]
  );

  const persistFailed = useCallback(
    (requestId: string, fileType: string, message: string, error: IApiErrorResponse) => {
      const existing = readStorage();
      if (existing) {
        setStorage({ ...existing, status: 'FAILED', failedMessage: message });
      } else {
        setStorage({
          requestId,
          fileType,
          status: 'FAILED',
          startedAt: Date.now(),
          failedMessage: message
        });
      }
      setDownloadStatus('FAILED');
      setReadyFile(null);
      setFailedMessage(message);
      onErrorRef.current(error);
    },
    [readStorage, setStorage]
  );

  const handleFailedStatus = useCallback(
    async (requestId: string, fileType: string, statusRes: any) => {
      const fallbackMessage = 'Something went wrong while generating your report. Please try again.';
      let message = fallbackMessage;
      let failedToast = toApiError(fallbackMessage);
      try {
        const urlRes = await getReportDownloadUrlCloud(userRef.current as any, { requestId });
        message =
          urlRes?.message ||
          urlRes?.default_error_message ||
          urlRes?.description ||
          message;
        failedToast = toApiError(
          message,
          urlRes?.default_error_message || '',
          urlRes?.error_code || ''
        );
      } catch (err: any) {
        message =
          err?.default_error_message ||
          err?.description ||
          err?.error_code ||
          message;
        failedToast = toApiError(
          err?.description || message,
          err?.default_error_message || '',
          err?.error_code || ''
        );
      }
      persistFailed(requestId, fileType, message, failedToast);
    },
    [persistFailed, toApiError]
  );

  const handleReadyStatus = useCallback(
    async (requestId: string, fileType: string, abort: { aborted: boolean }) => {
      let urlRes: any;
      try {
        urlRes = await getReportDownloadUrlCloud(userRef.current as any, { requestId });
      } catch (err: any) {
        if (abort.aborted) return;
        setIdleWithError(toApiError(
          err?.description || 'Failed to retrieve download URL',
          err?.default_error_message || '',
          err?.error_code || ''
        ));
        return;
      }

      if (abort.aborted) return;

      const url: string = urlRes?.fileUrl ?? '';
      if (!url) {
        setIdleWithError(toApiError('Download URL was empty'));
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
      setFailedMessage(null);
      onDownloadReadyRef.current(fileName);
    },
    [writeStorage, setIdleWithError, toApiError]
  );

  const pollHelpers = useMemo(
    () => ({
      readStorage,
      clearStorage,
      writeStorage,
      setStorage,
      waitForVisible,
      jobTtlMs,
      pollIntervalMs,
      toApiError,
      setIdleWithError,
      persistFailed,
      handleFailedStatus,
      handleReadyStatus
    }),
    [
      readStorage,
      clearStorage,
      writeStorage,
      setStorage,
      waitForVisible,
      jobTtlMs,
      pollIntervalMs,
      toApiError,
      setIdleWithError,
      persistFailed,
      handleFailedStatus,
      handleReadyStatus
    ]
  );

  const runPollLoop = useCallback(
    async (requestId: string, fileType: string, abort: { aborted: boolean }) => {
      const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
      let attempt = 0;

      const startTime = pollHelpers.readStorage()?.startedAt ?? Date.now();
      while (!abort.aborted) {
        let statusRes: any;

        if (Date.now() - startTime > pollHelpers.jobTtlMs) {
          pollHelpers.setIdleWithError(pollHelpers.toApiError('Report is taking too long. Please try again.'));
          return;
        }

        try {
          statusRes = await getReportDownloadStatus(userRef.current as any, requestId);
        } catch (err: any) {
          if (abort.aborted) return;
          pollHelpers.setIdleWithError(pollHelpers.toApiError(
            err?.description || 'Failed to check report status',
            err?.default_error_message || '',
            err?.error_code || ''
          ));
          return;
        }

        if (abort.aborted) return;

        const rawStatus = String(statusRes?.status ?? '').toUpperCase();

        if (rawStatus === '' || rawStatus === 'PENDING') {
          setDownloadStatus('PENDING');
          pollHelpers.writeStorage({ status: 'PENDING' });
          // await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          await delay(pollHelpers.pollIntervalMs);
          attempt++;
          await pollHelpers.waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'RUNNING') {
          setDownloadStatus('RUNNING');
          pollHelpers.writeStorage({ status: 'RUNNING' });
          // await delay(Math.min(POLL_INITIAL_MS * 2 ** attempt, POLL_MAX_MS));
          await delay(pollHelpers.pollIntervalMs);
          attempt++;
          await pollHelpers.waitForVisible(abort);
          continue;
        }

        if (rawStatus === 'FAILED') {
          await pollHelpers.handleFailedStatus(requestId, fileType, statusRes);
          return;
        }

        if (rawStatus === 'READY') {
          await pollHelpers.handleReadyStatus(requestId, fileType, abort);
          return;
        }

        pollHelpers.clearStorage();
        setDownloadStatus('IDLE');
        setFailedMessage(null);
        onErrorRef.current(pollHelpers.toApiError(`Unexpected report status: "${rawStatus || '(empty)'}`));
        return;
      }
    },
    [pollHelpers]
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
    setFailedMessage(null);

    const stored = readStorage();
    if (!stored) return;

    if (stored.status === 'FAILED') {
      setDownloadStatus('FAILED');
      setFailedMessage(stored.failedMessage || 'Something went wrong while generating your report. Please try again.');
      return;
    }

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
      setFailedMessage(null);
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
    setFailedMessage(null);
    void runPollLoop(requestId, fileType, abort);
  }, [storageKey, runPollLoop]);

  const isDownloading = downloadStatus === 'PENDING' || downloadStatus === 'RUNNING';

  return { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState };
}

