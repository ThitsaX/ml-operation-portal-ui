import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { FiSave, FiTrash2 } from 'react-icons/fi';
import {
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack, HStack,
  Input,
  Button,
  Box,
  Text,
  Switch,
  Flex,
  useToast,
  Table, Thead, Tr, Th, Td, Tbody,
  Checkbox,
  useBreakpointValue,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { CustomSelect } from '@components/interface';
import type { OptionType } from '@components/interface/CustomSelect';

import {
  createSettlementScheduler,
  getSettlementSchedulerList,
  modifySettlementModel,
  modifySettlementScheduler,
  removeSettlementScheduler
} from '@services/settlements';
import { ISettlementScheduleForm, ISettlementScheduleFormResponse } from '@typescript/form/settlements';
import { ISettlementModel } from '@typescript/services';
import { allTimezones, useTimezoneSelect } from 'react-timezone-select';
import { getNextRunInfo, formatCountdown } from '@utils/schedule';
import { useTranslation } from 'react-i18next';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementModel: ISettlementModel;
  onUpdated?: (updated: ISettlementModel) => void;
}

const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose, settlementModel, onUpdated }) => {
  const toast = useToast();
  const { t } = useTranslation();
  // which row (key) are we about to delete?
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const MODEL_CODE = 'DFN';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  type Day = typeof days[number];
  const DOW_MAP: Record<Day, string> = { Mon: 'MON', Tue: 'TUE', Wed: 'WED', Thu: 'THU', Fri: 'FRI', Sat: 'SAT', Sun: 'SUN' };
  const REV_DOW_MAP: Record<string, Day> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' };


  const [serverMatrix, setServerMatrix] = useState<Record<string, Set<Day>>>({});
  const setsEqual = (a?: Set<Day>, b?: Set<Day>) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  };
  const getRowSet = (m: Record<string, Set<Day>>, key: string) => m[key] ?? new Set<Day>();

  const canUpdate = (key: string) => {
    const ui = getRowSet(matrix, key);
    const sv = getRowSet(serverMatrix, key);
    const hasId = !!rowIdMap[key];
    if (!hasId) return ui.size > 0;
    if (ui.size === 0 && sv.size > 0) return true;
    return !setsEqual(ui, sv);
  };

  const [rows, setRows] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<Day>>>({
    // Example Format
    // '09:00': new Set<Day>(['Wed', 'Sat']),
    // '09:30': new Set<Day>([]),
    // '10:00': new Set<Day>(['Mon', 'Wed', 'Sat']),
  })
  const [newHour, setNewHour] = useState<string>('09');
  const [newMinute, setNewMinute] = useState<string>('00');
  const [selectedTz, setSelectedTz] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [savedTz, setSavedTz] = useState<string>(selectedTz);
  const tzDirty = selectedTz !== savedTz;

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoCloseWindow, setAutoCloseWindow] = useState<boolean>(settlementModel.autoCloseWindow);
  const [manualCloseWindow, setManualCloseWindow] = useState<boolean>(settlementModel.manualCloseWindow);

  const [rowActiveMap, setRowActiveMap] = useState<Record<string, boolean>>({});
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [rowIdMap, setRowIdMap] = useState<Record<string, string | undefined>>({});

  type SortDir = 'asc' | 'desc';
  const [timeSortDir, setTimeSortDir] = useState<SortDir>('asc');
  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => a.localeCompare(b));
    if (timeSortDir === 'desc') arr.reverse();
    return arr;
  }, [rows, timeSortDir]);

  const toggleTimeSort = useCallback(() => {
    setTimeSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const normalizeTime = (h: string, m: string) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`

  const humanDays = (days: Day[]) => {
    const set = new Set(days);
    if (set.size === 7) return t('ui.daily');
    if (set.size === 5 && !set.has('Sat') && !set.has('Sun')) return t('ui.weekdays');
    if (set.size === 2 && set.has('Sat') && set.has('Sun')) return t('ui.weekends');
    return days.join('_');
  };

  const nameForKey = (key: string, setOverride?: Set<Day>) => {
    const { time } = splitKey(key);
    const set = setOverride ?? matrix[key] ?? new Set<Day>();
    const days = Array.from(set);
    const label = humanDays(days);
    return `${MODEL_CODE}_${label}_${time}`;
  };

  const descriptionForKey = (key: string, cron: string | null, setOverride?: Set<Day>) => {
    const { time } = splitKey(key);
    const set = setOverride ?? matrix[key] ?? new Set<Day>();
    const days = Array.from(set);
    const when = humanDays(days);
    const model = settlementModel.name || t('ui.settlement_model');
    const base = `${t('ui.run_for')} ${model} ${t('ui.at')} ${time}`;
    const repeat = when ? ` ${t('ui.every')} ${when}` : '';
    return `${base}${repeat}`;
  };

  // helper: turn IANA -> current numeric offset like "+07:00"
  const getOffsetForZone = (timeZone: string): string => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit', minute: '2-digit',
    });
    const off = fmt.formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? '';
    const m = off.replace('GMT', '').replace('UTC', '').match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
    const sign = m?.[1] ?? '+', hh = String(Number(m?.[2] ?? '0')).padStart(2, '0'), mm = String(m?.[3] ?? '00').padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  };

  const currentOffset = useMemo(() => getOffsetForZone(selectedTz), [selectedTz]);

  const hasAnyActiveSchedule = useMemo(
    () => rows.some((k) => (rowActiveMap[k] && (matrix[k]?.size ?? 0) > 0)),
    [rows, matrix, rowActiveMap]
  );

  const COMMON_TZS = [
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Africa/Johannesburg',
    'Africa/Nairobi',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Jakarta',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  const { options: rtsOptions } = useTimezoneSelect({
    labelStyle: 'original',
    timezones: allTimezones,
  });

  const stripLeadingGMT = (s: string) =>
    s.replace(/^\(GMT[+\-−]\d{1,2}:\d{2}\)\s*/i, '');

  const getZones = (): string[] => {
    const anyIntl = Intl as any;
    if (typeof anyIntl?.supportedValuesOf === 'function') { // fix yarn build failure 
      try {
        const zones = anyIntl.supportedValuesOf('timeZone') as string[];
        if (Array.isArray(zones) && zones.length) return zones;
      } catch { }
    }
    // Fallback if API missing or throws
    return COMMON_TZS;
  };

  const HOUR_OPTS: OptionType[] =
    Array.from({ length: 24 }, (_, i) => {
      const v = String(i).padStart(2, '0');
      return { value: v, label: v };
    });

  // minutes: 00–59
  const MIN_OPTS: OptionType[] =
    Array.from({ length: 60 }, (_, i) => {
      const v = String(i).padStart(2, '0');
      return { value: v, label: v };
    });

  const TZ_OPTS: OptionType[] = getZones().map((tz) => {
    const off = getOffsetForZone(tz); // returns "+HH:MM"
    return { value: tz, label: `(${off} ${tz})` };
  });

  const makeKey = (time: string) => time;
  const splitKey = (key: string) => ({ time: key });

  useEffect(() => {
    setAutoCloseWindow(!!settlementModel.autoCloseWindow);
  }, [settlementModel?.autoCloseWindow]);


  useEffect(() => {
    setManualCloseWindow(!!settlementModel.manualCloseWindow);
  }, [settlementModel?.manualCloseWindow]);

  type TzOption = OptionType & { offset: string };

  const tzOptionsFull: TzOption[] = useMemo(
    () =>
      rtsOptions.map(o => {
        const iana = String(o.value);
        const offset = getOffsetForZone(iana);
        const clean = stripLeadingGMT(String(o.label));
        return {
          value: iana,
          label: `(GMT${offset}) ${clean}`,
          offset,
        };
      }),
    [rtsOptions]
  );

  const tzOptions: OptionType[] = useMemo(
    () => tzOptionsFull.map(({ value, label }) => ({ value, label })),
    [tzOptionsFull]
  );

  useEffect(() => {
    if (!isOpen || !settlementModel) return;

    let cancelled = false;

    (async () => {
      try {
        if (!cancelled) {
          await refreshSchedules();
        }

      } catch (e) {
        toast({ status: 'error', title: t('ui.load_failed'), description: t('ui.could_not_fetch_scheduler'), isClosable: true });
        setRows([]);
        setMatrix({});
        setRowIdMap({});
      }
    })();


    const byOffset = tzOptionsFull.find(opt => opt.offset === (settlementModel.zoneId || ''));
    if (byOffset) {
      setSelectedTz(byOffset.value);
      setSavedTz(byOffset.value);
    } else {

      setSavedTz(selectedTz);
    }

    return () => { cancelled = true; };
  }, [isOpen, settlementModel.settlementModelId, settlementModel?.zoneId, tzOptionsFull]);

  const buildCronForKey = (key: string, setOverride?: Set<Day>): { cron: string | null, zoneId: string } => {
    const { time } = splitKey(key);
    const set = setOverride ?? matrix[key];
    if (!set || set.size === 0) return { cron: null, zoneId: currentOffset };

    const [hh, mm] = time.split(':');
    const days = Array.from(set);
    if (!days.length) return { cron: null, zoneId: currentOffset };

    const dow = days.map(d => DOW_MAP[d]).join(',');
    return { cron: `0 ${mm} ${hh} ? * ${dow}`, zoneId: currentOffset };
  };

  const [nextCountdown, setNextCountdown] = useState<string>('--:--:--');
  const [nextUtc, setNextUtc] = useState<number | null>(null);

  const buildActiveCronList = useCallback((): string[] => {
    const map: Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', 'MON'|'TUE'|'WED'|'THU'|'FRI'|'SAT'|'SUN'> = {
      Mon:'MON', Tue:'TUE', Wed:'WED', Thu:'THU', Fri:'FRI', Sat:'SAT', Sun:'SUN'
    };

    const out: string[] = [];
    for (const key of rows) {
      if (!rowActiveMap[key]) continue;           // must be toggled ON
      
      const set = matrix[key];
      
      if (!(set && set.size)) continue;           // at least one day

      const [HH, MM] = key.split(':');
      const dows = Array.from(set).map(d => map[d]).sort();
      
      out.push(`0 ${MM} ${HH} ? * ${dows.join(',')}`);
    }
    return out;
  }, [rows, matrix, rowActiveMap]);

  useEffect(() => {
    const zoneOffset =
      typeof settlementModel.zoneId === 'string' &&
      /^(?:[+-]\d{2}:[0-5]\d)$/.test(settlementModel.zoneId)
        ? settlementModel.zoneId
        : currentOffset;

    const crons = buildActiveCronList();

    if (!settlementModel.autoCloseWindow || !crons.length) {
      setNextUtc(null);
      setNextCountdown('--:--:--');
      return;
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const { nextUtc: n, countdown } = getNextRunInfo(
        crons,
        zoneOffset,
        Date.now(),
        settlementModel.autoCloseWindow
      );

      if (!n) {
        setNextUtc(null);
        setNextCountdown('--:--:--');
        return;
      }

      setNextUtc(n);
      setNextCountdown(countdown);
    };

    tick();

    const id = setInterval(tick, 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    rows,
    matrix,
    rowActiveMap,
    settlementModel.zoneId,
    settlementModel.autoCloseWindow,
    currentOffset,
    buildActiveCronList,
  ]);

  useEffect(() => {
    if (!nextUtc) return;
    const id = setInterval(() => {
      setNextCountdown(formatCountdown(nextUtc - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [nextUtc]);

  const mustKeepOneOn = (turningOff: 'auto' | 'manual') => {
    if (turningOff === 'auto' && !manualCloseWindow) return true;
    if (turningOff === 'manual' && !autoCloseWindow) return true;
    return false;
  };

  const ensureAutoCloseEnabled = async () => {
    if (!autoCloseWindow || !settlementModel.autoCloseWindow) {
      await modifySettlementModel({
        settlementModelId: settlementModel.settlementModelId,
        name: settlementModel.name,
        modelType: settlementModel.type,
        currencyID: (settlementModel.currencyId ?? ''),
        active: true,
        autoCloseWindow: true,
        manualCloseWindow: manualCloseWindow,
        zoneId: currentOffset
      });
      setAutoCloseWindow(true);
      // tell parent so it updates its copy (table/list)
      onUpdated?.({ ...settlementModel, autoCloseWindow: true, manualCloseWindow });
      settlementModel.autoCloseWindow = true;
      settlementModel.manualCloseWindow = manualCloseWindow;
      settlementModel.zoneId = currentOffset;

      toast({
        status: 'success',
        title: t('ui.auto_close_enabled'),
        description: t('ui.model_is_now_configured_to_close_windows_automatically'),
        isClosable: true,
      });
    }
  };

  const saveRow = async (key: string) => {
    const set = matrix[key] ?? new Set<Day>();
    const { cron, zoneId } = buildCronForKey(key, set);
    const schedulerName = nameForKey(key, set);
    const schedulerDesc = descriptionForKey(key, cron, set);

    const payload: ISettlementScheduleForm = {
      settlementModelId: settlementModel.settlementModelId,
      name: schedulerName,
      description: schedulerDesc,
      cronExpression: cron ?? '',
    };

    try {
      setIsSubmitting(true);
      await ensureAutoCloseEnabled();

      const hasId = !!rowIdMap[key];

      if (set.size === 0) {
        // delete?
        if (hasId) {
          await removeSettlementScheduler({
            settlementModelId: settlementModel.settlementModelId,
            schedulerConfigId: rowIdMap[key] as string
          });

          setRows((prev) => prev.filter((k) => k !== key));

          setMatrix((prev) => {
            const clone: Record<string, Set<Day>> = { ...prev };
            delete clone[key];
            return clone;
          });

          setServerMatrix((prev) => {
            const clone: Record<string, Set<Day>> = { ...prev };
            delete clone[key];
            return clone;
          });

          setRowIdMap((prev) => {
            const clone = { ...prev };
            delete clone[key];
            return clone;
          });

          setRowActiveMap((prev) => {
            const clone: Record<string, boolean> = { ...prev };
            delete clone[key];
            return clone;
          });

          // compute if there will be any active schedules left AFTER this deletion
          const otherHasActive = rows.some(
            (k) =>
              k !== key &&
              rowActiveMap[k] &&
              (matrix[k]?.size ?? 0) > 0
          );

          toast({ status: 'info', title: t('ui.removed'), description: `${nameForKey(key)} ${t('ui.cleared')}.` , isClosable: true,});

          if (!otherHasActive && (autoCloseWindow || settlementModel.autoCloseWindow)) {
            try {
              await modifySettlementModel({
                settlementModelId: settlementModel.settlementModelId,
                name: settlementModel.name,
                modelType: settlementModel.type,
                currencyID: settlementModel.currencyId ?? '',
                active: true,
                autoCloseWindow: false,
                manualCloseWindow: true,
                zoneId: currentOffset
              });
              setAutoCloseWindow(false);
              onUpdated?.({ ...settlementModel, autoCloseWindow: false });
              settlementModel.autoCloseWindow = false;
              toast({ 
                status: 'info', 
                title: t('ui.auto_close_disabled'), 
                description: t('ui.no_schedules_remain_for_this_model'),
                isClosable: true,
              });
            } catch { }
          }
        } else {
          setRows(r => r.filter(k => k !== key));
          setMatrix(m => {
            const clone = { ...m }; delete clone[key]; return clone;
          });
        }
        return;
      }

      // create or modify
      if (!hasId) {
        const newScheduler: ISettlementScheduleFormResponse = await createSettlementScheduler(payload);
        if (newScheduler?.schedulerConfigId) {
          
          setRowIdMap(prev => ({
            ...prev,
            [key]: newScheduler.schedulerConfigId,
          }));

          setServerMatrix(prev => ({
            ...prev,
            [key]: new Set(set),
          }));

          setRowActiveMap(prev => ({
            ...prev,
            [key]: true,
          }));
        } else{
          throw new Error(t('ui.scheduler_config_id_not_found'))
        }
        
        toast({ status: 'success', title: t('ui.created'), description: `${nameForKey(key)} ${t('ui.saved')}.` , isClosable: true,});
      } else {
        await modifySettlementScheduler({
          ...payload,
          active: true,
          schedulerConfigId: rowIdMap[key] as string
        });

        setServerMatrix(prev => ({
          ...prev,
          [key]: new Set(set),
        }));
        toast({ status: 'success', title: t('ui.updated'), description: `${nameForKey(key)} ${t('ui.updated').toLowerCase()}.` , isClosable: true});
      }

    } catch (e: any) {
      const msg = e?.default_error_message || e?.description || t('ui.failed_to_save_schedule');
      toast({ status: 'error', title: t('ui.error'), description: String(msg), isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRow = () => {
    const time = normalizeTime(newHour, newMinute);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      toast({ status: 'warning', title: t('ui.invalid_time'), description: t('ui.use_hh_mm_24_hour'), isClosable: true, });
      return;
    }
    if (!/^[+-]\d{2}:\d{2}$/.test(currentOffset)) {
      toast({ status: 'warning', title: t('ui.invalid_timezone'), description: t('ui.offset_must_be_hh_mm'), isClosable: true });
      return;
    }
    const key = makeKey(time);
    if (rows.includes(key)) {
      toast({ status: 'info', title: t('ui.duplicate_row'), description: `${time} ${t('ui.already_exists')}.` , isClosable: true});
      return;
    }
    setRows(r => [...r, key]);
    setMatrix(m => ({ ...m, [key]: new Set<Day>() }));
  };

  const deleteRow = async () => {
    if (!pendingDeleteKey) return;
    const key = pendingDeleteKey;
    setPendingDeleteKey(null);
    closeConfirm();

    try {
      setIsSubmitting(true);
      const sid = rowIdMap[key];
      if (sid) {
        await removeSettlementScheduler({ settlementModelId: settlementModel.settlementModelId, schedulerConfigId: sid } as any);
        toast({ status: 'info', title: t('ui.deleted'), description: `${nameForKey(key)} ${t('ui.removed').toLowerCase()}.` , isClosable: true});

        const { hasActive } = await refreshSchedules();
        if (!hasActive && (autoCloseWindow || settlementModel.autoCloseWindow)) {
          try {
            await modifySettlementModel({
              settlementModelId: settlementModel.settlementModelId,
              name: settlementModel.name,
              modelType: settlementModel.type,
              currencyID: settlementModel.currencyId ?? '',
              active: true,
              autoCloseWindow: false,
              manualCloseWindow: true,
            });
            setAutoCloseWindow(false);
            onUpdated?.({ ...settlementModel, autoCloseWindow: false });
            settlementModel.autoCloseWindow = false;

            toast({ status: 'info', title: t('ui.auto_close_disabled'), description: t('ui.no_schedules_remain_for_this_model'),isClosable: true });
          } catch (e: any) {
            toast({ 
              status: 'warning', 
              title: t('ui.could_not_disable_auto_close'), 
              description: e?.default_error_message || e?.description || t('ui.please_try_again'), 
              isClosable: true 
            });
          }
        }
      } else {
        // just local ui remove row
        setRows(r => r.filter(k => k !== key));
        setMatrix(m => {
          const clone: Record<string, Set<Day>> = {};
          for (const k of Object.keys(m)) if (k !== key) clone[k] = m[k];
          return clone;
        });
        setRowIdMap(ids => {
          const clone = { ...ids };
          delete clone[key];
          return clone;
        });
      }
    } catch (e: any) {
      const msg = e?.default_error_message || e?.description || t('ui.failed_to_remove_schedule');
      toast({ status: 'error', title: t('ui.error'), description: String(msg), isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteRow = (key: string) => {
    setPendingDeleteKey(key);
    openConfirm();
  };

  const refreshSchedules = async (): Promise<{ hasActive: boolean }> => {
    const resp = await getSettlementSchedulerList(settlementModel.settlementModelId);
    const objList: any[] = Array.isArray(resp?.settlementSchedulerList) ? resp.settlementSchedulerList : [];

    const nextRows = new Set<string>();
    const nextMatrix: Record<string, Set<Day>> = {};
    const nextIds: Record<string, string | undefined> = {};
    const nextActive: Record<string, boolean> = {};

    if (objList.length) {
      for (const it of objList) {
        const ex = it?.cronExpression as string | undefined;
        if (!ex) continue;
        const p = parseQuartzCron(ex);
        if (!p) continue;

        const key = makeKey(p.time);          // time-only key
        nextRows.add(key);
        if (!nextMatrix[key]) nextMatrix[key] = new Set<Day>();
        p.dayList.forEach((d) => nextMatrix[key].add(d));
        if (it?.schedulerConfigId) nextIds[key] = String(it.schedulerConfigId);

        nextActive[key] = Boolean(it?.active ?? true);
      }
    }

    const rowsArr = Array.from(nextRows);
    setRows(rowsArr);
    setMatrix(nextMatrix);
    setServerMatrix(nextMatrix);
    setRowIdMap(nextIds);
    setRowActiveMap(nextActive);

    return { hasActive: rowsArr.length > 0 };
  };


  const parseQuartzCron = (expr: string) => {
    // expected: 0 mm HH ? * DOW[,DOW...]

    const parts = expr.trim().split(/\s+/);

    if (parts.length < 6) return null;

    const [sec, mm, HH, dom, mon, dow] = parts;

    if (sec !== '0') return null;

    if (!/^\d{1,2}$/.test(mm) || !/^\d{1,2}$/.test(HH)) return null;

    const time = `${String(HH).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

    const daysStr = (dow || '').split(',').map((s) => s.toUpperCase().trim()).filter(Boolean);

    const dayList: Day[] = [];
    for (const d of daysStr) {
      if (REV_DOW_MAP[d]) {
        dayList.push(REV_DOW_MAP[d]);
      }
    }
    return { time, dayList };
  };

  const toggleCell = async (key: string, day: Day) => {
    setMatrix(prev => {
      const prevSet = prev[key] ?? new Set<Day>();
      const next = new Set(prevSet);
      next.has(day) ? next.delete(day) : next.add(day);
      return { ...prev, [key]: next };
    });
  };

  const mustAddScheduleNow = autoCloseWindow && !hasAnyActiveSchedule;

  const handleManualCloseToggle = async (checked: boolean) => {
    try {
      setManualCloseWindow(checked);
      await modifySettlementModel({
        settlementModelId: settlementModel.settlementModelId,
        name: settlementModel.name,
        modelType: settlementModel.type,
        currencyID: (settlementModel.currencyId ?? ''),
        active: true,
        manualCloseWindow: checked,
        autoCloseWindow: autoCloseWindow,
        zoneId: currentOffset
      } as any);
      onUpdated?.({ ...settlementModel, manualCloseWindow: checked, zoneId: currentOffset });
      settlementModel.manualCloseWindow = checked;
      settlementModel.zoneId = currentOffset;

      toast({ status: 'success', title: t('ui.updated'), description: `${t('ui.manual_close')} ${checked ? t('ui.enabled') : t('ui.disabled')}.` , isClosable: true });
    } catch (err: any) {
      setManualCloseWindow(!checked); // revert UI
      toast({ status: 'error', title: t('ui.failed'), description: err?.default_error_message || err?.description || t('ui.unable_to_modify_settlement_model'), isClosable: true });
    }
  }

  const handleAutoCloseToggle = async (checked: boolean) => {
    setAutoCloseWindow(checked);

    const payload = {
      settlementModelId: settlementModel.settlementModelId,
      name: settlementModel.name,
      modelType: settlementModel.type,
      currencyID: (settlementModel.currencyId ?? ''),
      active: true,
      autoCloseWindow: checked,
      manualCloseWindow: manualCloseWindow,
      zoneId: currentOffset,
    };

    if (!checked) {
      // Turn OFF immediately on the backend
      try {
        await modifySettlementModel({
          settlementModelId: settlementModel.settlementModelId,
          name: settlementModel.name,
          modelType: settlementModel.type,
          currencyID: settlementModel.currencyId ?? '',
          active: true,
          autoCloseWindow: false,
          manualCloseWindow: manualCloseWindow,
          zoneId: currentOffset
        });
        onUpdated?.({ ...settlementModel, autoCloseWindow: false, manualCloseWindow, zoneId: currentOffset });
        settlementModel.autoCloseWindow = false;
        settlementModel.manualCloseWindow = manualCloseWindow;
        settlementModel.zoneId = currentOffset;

        await refreshSchedules(); // when disabling the rows should disabled(updated) by backend.. so we fetched again
 
        toast({ status: 'success', title: t('ui.updated'), description: t('ui.auto_close_disabled_with_dot'), isClosable: true });
      } catch (e: any) {
        setAutoCloseWindow(true); // revert
        toast({ status: 'error', title: t('ui.failed'), description: e?.default_error_message || e?.description || t('ui.unable_to_modify_settlement_model'), isClosable: true });
      }
      return;
    }

    if (hasAnyActiveSchedule) {
      try {
        await modifySettlementModel(payload);

        onUpdated?.({ ...settlementModel, autoCloseWindow: checked, manualCloseWindow, zoneId: currentOffset });
        settlementModel.autoCloseWindow = checked;
        settlementModel.manualCloseWindow = manualCloseWindow;
        settlementModel.zoneId = currentOffset;

        toast({
          status: 'success',
          title: t('ui.updated'),
          description: `${t('ui.auto_close_window')} ${checked ? t('ui.enabled') : t('ui.disabled')}.`,
          isClosable: true
        });
      } catch (e: any) {
        toast({
          status: 'error',
          title: t('ui.failed'),
          description: e?.default_error_message || e?.description || t('ui.unable_to_modify_settlement_model'),
          isClosable: true
        });
      }
    };
  }

  const handleSaveTimezone = async () => {
    try {
      setIsSubmitting(true);

      await modifySettlementModel({
        settlementModelId: settlementModel.settlementModelId,
        name: settlementModel.name,
        modelType: settlementModel.type,
        currencyID: settlementModel.currencyId ?? '',
        active: true,
        autoCloseWindow: autoCloseWindow,
        manualCloseWindow: manualCloseWindow,
        zoneId: currentOffset,
      });

      setSavedTz(selectedTz); // mark clean
      onUpdated?.({ ...settlementModel, autoCloseWindow, manualCloseWindow, zoneId: currentOffset } as any);

      toast({ status: 'success', title: t('ui.saved'), description: `${t('ui.timezone_updated_to')} (GMT${currentOffset}) ${selectedTz}` , isClosable: true});
    } catch (e: any) {
      toast({ status: 'error', title: t('ui.save_failed'), description: e?.default_error_message || e?.description || t('ui.unable_to_update_timezone'), isClosable: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRowActive = async (key: string) => {
    try {
      setTogglingKey(key);
      setIsSubmitting(true);

      const set = matrix[key] ?? new Set<Day>();
      const { cron, zoneId } = buildCronForKey(key, set);
      const schedulerName = nameForKey(key, set);
      const schedulerDesc = descriptionForKey(key, cron, set);
      const currentActive = !!rowActiveMap[key];
      const schedulerConfigId = rowIdMap[key];

      if (!schedulerConfigId) {
        toast({ status: 'warning', title: t('ui.not_created_yet'), description: t('ui.save_the_row_first_before_toggling'), isClosable: true });
        return;
      }

      await modifySettlementScheduler({
        settlementModelId: settlementModel.settlementModelId,
        schedulerConfigId,
        name: schedulerName,
        description: schedulerDesc,
        cronExpression: cron ?? '',
        active: !currentActive,
      });

      const { hasActive } = await refreshSchedules();

      if (!hasActive && (autoCloseWindow || settlementModel.autoCloseWindow)) {
        try {
          await modifySettlementModel({
            settlementModelId: settlementModel.settlementModelId,
            name: settlementModel.name,
            modelType: settlementModel.type,
            currencyID: settlementModel.currencyId ?? '',
            active: true,
            autoCloseWindow: false,
            manualCloseWindow: !!manualCloseWindow,
            zoneId: currentOffset,
          });
          setAutoCloseWindow(false);
          onUpdated?.({ ...settlementModel, autoCloseWindow: false });
          settlementModel.autoCloseWindow = false;
          toast({ status: 'info', title: t('ui.auto_close_disabled'), description: t('ui.no_active_schedules_remain'), isClosable: true });
        } catch (e: any) {
          toast({ status: 'warning', title: t('ui.could_not_disable_auto_close'), description: e?.default_error_message || e?.description || t('ui.please_try_again'), isClosable: true });
        }
      } else {
        await ensureAutoCloseEnabled();

        toast({
          status: 'success',
          title: !currentActive ? t('ui.activated') : t('ui.deactivated'),
          description: nameForKey(key),
          isClosable: true
        });
      }
    } catch (e: any) {
      toast({ status: 'error', title: t('ui.toggle_failed'), description: e?.default_error_message || e?.description || t('ui.unable_to_change_status'), isClosable: true });
    } finally {
      setIsSubmitting(false);
      setTogglingKey(null);  // NEW
    }
  };

  // Icon-only on base & md (covers iPad portrait)
  const isIconOnly = useBreakpointValue({ base: true, md: true, lg: false });

  const ActionBtn = ({
    label,
    icon,
    tooltip,
    ...props
  }: {
    label: string;
    icon: React.ReactElement;
    tooltip?: string;
  } & React.ComponentProps<typeof Button>) => {
    if (isIconOnly) {
      const iconBtn = (
        <IconButton aria-label={label} icon={icon} {...props} />
      );
      return tooltip ? <Tooltip label={tooltip}>{iconBtn}</Tooltip> : iconBtn;
    }
    return (
      <Button leftIcon={icon} {...props}>
        {label}
      </Button>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="left" fontSize="xl" fontWeight="bold" textDecoration="underline">
          {t('ui.settlement_models')}
        </ModalHeader>
        <ModalCloseButton isDisabled={mustAddScheduleNow} />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.settlement_model_name')}</Text>
              <Input ml="2" value={settlementModel.name ?? ''} isDisabled flex="1" maxW="60%" />
            </Flex>

            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.settlement_model_type')}</Text>
              <Input ml="2" value={settlementModel.type ?? ''} isDisabled flex="1" maxW="60%" />
            </Flex>

            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.settlement_model_currency')}</Text>
              <Input ml="2" value={settlementModel.currencyId ?? t('ui.not_available')} isDisabled flex="1" maxW="60%" />
            </Flex>
            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.close_window_manually')}</Text>
              <Switch
                ml="2"
                isChecked={manualCloseWindow}
                colorScheme="green"
                onChange={async (e) => {
                  const next = e.target.checked;
                  // enforce at least one ON
                  if (!next && mustKeepOneOn('manual')) {
                    toast({ status: 'warning', title: t('ui.at_least_one_must_be_on'), description: t('ui.auto_or_manual_must_stay_enabled'), isClosable: true });
                    return;
                  }
                  handleManualCloseToggle(next);
                }}
              />
            </Flex>
            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.close_window_automatically')}</Text>
              <Switch
                ml="2"
                isChecked={autoCloseWindow}
                colorScheme="green"
                onChange={(e) => {
                  const next = e.target.checked;
                  if (!next && mustKeepOneOn('auto')) {
                    toast({ status: 'warning', title: t('ui.at_least_one_must_be_on'), description: t('ui.auto_or_manual_must_stay_enabled'), isClosable: true });
                    return;
                  }
                  handleAutoCloseToggle(next);
                }}
              />
              {mustAddScheduleNow && (
                <Box mt={2}>
                  <Box border="1px solid" borderColor="orange.300" bg="orange.50" color="orange.800" rounded="md" p={3} ml={2} fontSize="sm">
                    {t('ui.auto_close_is_on_but_theres_no_active_schedule_yet')} <br />
                    {t('ui.add_a_time_row_and_tick_at_least_one_day_to_enable_saving')}
                  </Box>
                </Box>
              )}
            </Flex>
            <Flex align="center">
              <Text w="230px" fontWeight="semibold">{t('ui.choose_timezone')}</Text>
              <Box flex="1" maxW="60%">
                <CustomSelect
                  options={tzOptions}
                  value={tzOptions.find(z => z.value === selectedTz) ?? null}
                  onChange={(opt) => setSelectedTz(opt?.value ?? 'UTC')}
                  maxMenuHeight={300}
                  menuPlacement="top"
                />
                {tzDirty && (
                  <Text fontSize="sm" color="orange.500" mt={1}>
                    {t('ui.timezone_changed_click_save_to_apply')}
                  </Text>
                )}
              </Box>
            </Flex>
              <Box mb={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {t('ui.window_will_close_in')}: <Box as="span" color="blue.600">{nextCountdown}</Box>
                </Text>
              </Box>
            <Box
              border="1px"
              borderColor="gray.300"
              borderRadius="md"
              p={4}
              opacity={autoCloseWindow ? 1 : 0.5}
              pointerEvents={autoCloseWindow ? 'auto' : 'none'}
            >
              <VStack align="stretch" spacing={4}>
                <Table size="sm" variant="simple" >
                  <Thead>
                    <Tr>
                      <Th
                        w="80px"
                        textAlign="center"
                        cursor="pointer"
                        userSelect="none"
                        onClick={toggleTimeSort}
                      >
                        <HStack justify="center" spacing={1}>
                          <Text>{t('ui.hh_mm')}</Text>
                          {timeSortDir === 'asc' ? (
                            <TriangleUpIcon/>
                          ) : (
                            <TriangleDownIcon/>
                          )}
                        </HStack>
                      </Th>
                      {days.map((d) => (
                        <Th key={d} textAlign="center">{d}</Th>
                      ))}
                      <Th w="80px" textAlign="center"> </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedRows.map((key) => {
                      return (
                        <Tr key={key}>
                          <Td bg={rowActiveMap[key] ? 'green.50' : 'gray.100'} fontWeight="semibold" textAlign="center">
                            {`${key}`}
                          </Td>
                          {days.map((d, idx) => {
                            const active = !!matrix[key]?.has(d);
                            return (

                              <Td key={`${key}-${d}`} textAlign="center" cursor={isSubmitting ? 'not-allowed' : 'pointer'} onClick={() => !isSubmitting && toggleCell(key, d)}>
                                <Checkbox
                                  isChecked={active}
                                  colorScheme="green"
                                  pointerEvents="none"
                                  size="sm"
                                />
                              </Td>
                            );
                          })}
                          <Td textAlign="center">
                            <HStack justify="center">
                              <ActionBtn
                                label={t('ui.update')}
                                icon={<FiSave />}
                                colorScheme="blue"
                                size="sm"
                                onClick={() => saveRow(key)}
                                isDisabled={!canUpdate(key) || isSubmitting}
                                tooltip={t('ui.update_schedule')}
                              />

                              <HStack spacing={2}>
                                <Switch
                                  size="lg"
                                  colorScheme="green"
                                  isChecked={!!rowActiveMap[key]}
                                  onChange={() => toggleRowActive(key)}
                                  isDisabled={!rowIdMap[key] || isSubmitting || togglingKey === key}
                                  aria-label={`Toggle active for ${nameForKey(key)}`}
                                />
                              </HStack>

                              <ActionBtn
                                label={t('ui.delete')}
                                icon={<FiTrash2 />}
                                colorScheme="red"
                                variant="solid"
                                size="sm"
                                onClick={() => requestDeleteRow(key)}
                                isDisabled={isSubmitting}
                                tooltip={`Delete ${nameForKey(key)}`}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}

                    <Tr>
                      <Td bg="gray.100" fontWeight="semibold" textAlign="center">{t('ui.select_time')}</Td>

                      <Td colSpan={days.length + 1}>
                        <HStack spacing={3}>
                          <Box w="100px">
                            <CustomSelect
                              options={HOUR_OPTS}
                              value={{ value: newHour, label: newHour }}
                              onChange={(opt: OptionType | null) => setNewHour((opt?.value as string) || '00')}
                              maxMenuHeight={300}
                              menuPlacement='top'
                            />
                          </Box>

                          {/* Minute */}
                          <Box w="100px">
                            <CustomSelect
                              options={MIN_OPTS}
                              value={{ value: newMinute, label: newMinute }}
                              onChange={(opt: OptionType | null) => setNewMinute((opt?.value as string) || '00')}
                              maxMenuHeight={300}
                              menuPlacement='top'
                            />
                          </Box>

                          <Button ml="auto" colorScheme="green" onClick={addRow}>{t('ui.add')}</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </VStack>
            </Box>

          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="blue"
            mr={3}
            onClick={handleSaveTimezone}
            isDisabled={!tzDirty || isSubmitting}
          >
            {t('ui.save')}
          </Button>
          <Button
            variant="outline"
            mr={3}
            onClick={onClose}
            isDisabled={isSubmitting || mustAddScheduleNow}
          >
            {t('ui.close')}
          </Button>
        </ModalFooter>
      </ModalContent>

      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeConfirm}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {t('ui.delete_schedule_question')}
            </AlertDialogHeader>

            <AlertDialogBody>
              {pendingDeleteKey ? (
                <>
                  {t('ui.are_you_sure_you_want_to_delete')} <b>{nameForKey(pendingDeleteKey)}</b>?
                  <br />
                  {t('ui.this_action_cannot_be_undone')}.
                </>
              ) : (
                t('ui.are_you_sure_you_want_to_delete_this_schedule')
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeConfirm} variant="outline">
                {t('ui.cancel')}
              </Button>
              <Button colorScheme="red" onClick={deleteRow} ml={3} isLoading={isSubmitting}>
                {t('ui.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
};

export default SettlementModal;
