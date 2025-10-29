import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Select,
  Button,
  Box,
  Text,
  Switch,
  Flex,
  useToast,
  Table, Thead, Tr, Th, Td, Tbody,
  Checkbox
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { CustomSelect } from '@components/interface';
import type { OptionType } from '@components/interface/CustomSelect';

import {
  createSettlementScheduler,
  getSettlementSchedulerList,
  modifySettlementModel,
  modifySettlementScheduler,
  removeSettlementScheduler
} from '@services/settlements';
import { ISettlementScheduleForm } from '@typescript/form/settlements';
import { ISettlementModel } from '@typescript/services';
import { allTimezones, useTimezoneSelect } from 'react-timezone-select';
interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementModel: ISettlementModel;
  onUpdated?: (updated: ISettlementModel) => void;
}

const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose, settlementModel, onUpdated }) => {
  const toast = useToast();
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

  const normalizeTime = (h: string, m: string) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`

  const humanDays = (days: Day[]) => {
    const set = new Set(days);
    if (set.size === 7) return 'Daily';
    if (set.size === 5 && !set.has('Sat') && !set.has('Sun')) return 'Weekdays';
    if (set.size === 2 && set.has('Sat') && set.has('Sun')) return 'Weekends';
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
    const model = settlementModel.name || 'Settlement Model';
    const base = `Run for ${model} at ${time}`;
    const repeat = when ? ` every ${when}` : '';
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
        toast({ status: 'error', title: 'Load failed', description: 'Could not fetch scheduler.' });
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
        title: 'Auto-close enabled',
        description: 'Model is now configured to close windows automatically.',
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
          const { hasActive } = await refreshSchedules();
          toast({ status: 'info', title: 'Removed', description: `${nameForKey(key)} cleared.` });

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
                zoneId: currentOffset
              });
              setAutoCloseWindow(false);
              onUpdated?.({ ...settlementModel, autoCloseWindow: false });
              settlementModel.autoCloseWindow = false;
              toast({ status: 'info', title: 'Auto-close disabled', description: 'No schedules remain for this model.' });
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
        await createSettlementScheduler(payload);
        await refreshSchedules();
        toast({ status: 'success', title: 'Created', description: `${nameForKey(key)} saved.` });
      } else {
        await modifySettlementScheduler({
          ...payload,
          active: true,
          schedulerConfigId: rowIdMap[key] as string
        });
        await refreshSchedules();
        toast({ status: 'success', title: 'Updated', description: `${nameForKey(key)} updated.` });
      }

    } catch (e: any) {
      const msg = e?.default_error_message || e?.description || 'Failed to save schedule.';
      toast({ status: 'error', title: 'Error', description: String(msg) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRow = () => {
    const time = normalizeTime(newHour, newMinute);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      toast({ status: 'warning', title: 'Invalid time', description: 'Use HH:mm (24-hour).' });
      return;
    }
    if (!/^[+-]\d{2}:\d{2}$/.test(currentOffset)) {
      toast({ status: 'warning', title: 'Invalid timezone', description: 'Offset must be ±HH:mm.' });
      return;
    }
    const key = makeKey(time);
    if (rows.includes(key)) {
      toast({ status: 'info', title: 'Duplicate row', description: `${time} already exists.` });
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
        toast({ status: 'info', title: 'Deleted', description: `${nameForKey(key)} removed.` });

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

            toast({ status: 'info', title: 'Auto-close disabled', description: 'No schedules remain for this model.' });
          } catch (e: any) {
            toast({ status: 'warning', title: 'Could not disable auto-close', description: e?.default_error_message || e?.description || 'Please try again.' });
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
      const msg = e?.default_error_message || e?.description || 'Failed to remove schedule.';
      toast({ status: 'error', title: 'Error', description: String(msg) });
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

      toast({ status: 'success', title: 'Updated', description: `Manual close ${checked ? 'enabled' : 'disabled'}.` });
    } catch (err: any) {
      setManualCloseWindow(!checked); // revert UI
      toast({ status: 'error', title: 'Failed', description: err?.default_error_message || err?.description || 'Unable to modify settlement model.' });
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

        toast({ status: 'success', title: 'Updated', description: 'Auto-close disabled.' });
      } catch (e: any) {
        setAutoCloseWindow(true); // revert
        toast({ status: 'error', title: 'Failed', description: e?.default_error_message || e?.description || 'Unable to modify settlement model.' });
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
          title: 'Updated',
          description: `Auto-close window ${checked ? 'enabled' : 'disabled'}.`
        });
      } catch (e: any) {
        toast({
          status: 'error',
          title: 'Failed',
          description: e?.default_error_message || e?.description || 'Unable to modify settlement model.'
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

      toast({ status: 'success', title: 'Saved', description: `Timezone updated to (GMT${currentOffset}) ${selectedTz}` });
    } catch (e: any) {
      toast({ status: 'error', title: 'Save failed', description: e?.default_error_message || e?.description || 'Unable to update timezone.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRowActive = async (key: string) => {
    try {
      setTogglingKey(key);   // NEW
      setIsSubmitting(true);

      const set = matrix[key] ?? new Set<Day>();
      const { cron, zoneId } = buildCronForKey(key, set);
      const schedulerName = nameForKey(key, set);
      const schedulerDesc = descriptionForKey(key, cron, set);
      const currentActive = !!rowActiveMap[key];
      const schedulerConfigId = rowIdMap[key];

      if (!schedulerConfigId) {
        toast({ status: 'warning', title: 'Not created yet', description: 'Save the row first before toggling.' });
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
          toast({ status: 'info', title: 'Auto-close disabled', description: 'No active schedules remain.' });
        } catch (e: any) {
          toast({ status: 'warning', title: 'Could not disable auto-close', description: e?.default_error_message || e?.description || 'Please try again.' });
        }
      } else {
        toast({
          status: 'success',
          title: !currentActive ? 'Activated' : 'Deactivated',
          description: nameForKey(key),
        });
      }
    } catch (e: any) {
      toast({ status: 'error', title: 'Toggle failed', description: e?.default_error_message || e?.description || 'Unable to change status.' });
    } finally {
      setIsSubmitting(false);
      setTogglingKey(null);  // NEW
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="left" fontSize="xl" fontWeight="bold" textDecoration="underline">
          Settlement Models
        </ModalHeader>
        <ModalCloseButton isDisabled={mustAddScheduleNow} />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Flex align="center">
              <Text w="220px" fontWeight="semibold">Settlement Model Name:</Text>
              <Input ml="2" value={settlementModel.name ?? ''} isDisabled flex="1" maxW="60%" />
            </Flex>

            <Flex align="center">
              <Text w="220px" fontWeight="semibold">Settlement Model Type:</Text>
              <Input ml="2" value={settlementModel.type ?? ''} isDisabled flex="1" maxW="60%" />
            </Flex>

            <Flex align="center">
              <Text w="220px" fontWeight="semibold">Settlement Model Currency:</Text>
              <Input ml="2" value={settlementModel.currencyId ?? 'N/A'} isDisabled flex="1" maxW="60%" />
            </Flex>
            <Flex align="center">
              <Text w="220px" fontWeight="semibold">Close Window Manually: </Text>
              <Switch
                ml="2"
                isChecked={manualCloseWindow}
                colorScheme="green"
                onChange={async (e) => {
                  const next = e.target.checked;
                  // enforce at least one ON
                  if (!next && mustKeepOneOn('manual')) {
                    toast({ status: 'warning', title: 'At least one must be ON', description: 'Auto or Manual must stay enabled.' });
                    return;
                  }
                  handleManualCloseToggle(next);
                }}
              />
            </Flex>
            <Flex align="center">
              <Text fontWeight="semibold">Close Window Automatically: </Text>
              <Switch
                ml="2"
                isChecked={autoCloseWindow}
                colorScheme="green"
                onChange={(e) => {
                  const next = e.target.checked;
                  if (!next && mustKeepOneOn('auto')) {
                    toast({ status: 'warning', title: 'At least one must be ON', description: 'Auto or Manual must stay enabled.' });
                    return;
                  }
                  handleAutoCloseToggle(next);
                }}
              />
              {mustAddScheduleNow && (
                <Box mt={2}>
                  <Box border="1px solid" borderColor="orange.300" bg="orange.50" color="orange.800" rounded="md" p={3} ml={2} fontSize="sm">
                    Auto-close is ON, but there’s no active schedule yet. <br />
                    Add a time row and tick at least one day to enable saving.
                  </Box>
                </Box>
              )}
            </Flex>
            <Flex align="center">
              <Text w="220px" fontWeight="semibold">Choose Timezone:</Text>
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
                    Timezone changed — click Save to apply.
                  </Text>
                )}
              </Box>
            </Flex>
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
                      <Th w="120px" textAlign="center">HH:MM</Th>
                      {days.map((d) => (
                        <Th key={d} textAlign="center">{d}</Th>
                      ))}
                      <Th w="100px" textAlign="center"> </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.slice().map((key) => {
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
                            <HStack justify="center" spacing={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => saveRow(key)}
                                isDisabled={!canUpdate(key) || isSubmitting}
                              >
                                UPDATE
                              </Button>
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

                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="solid"
                                onClick={() => requestDeleteRow(key)}
                                leftIcon={<CloseIcon boxSize={2.5} />}
                                isDisabled={isSubmitting}
                              >
                                DELETE
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}

                    <Tr>
                      <Td bg="gray.100" fontWeight="semibold" textAlign="center">Select Time</Td>

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

                          <Button ml="auto" colorScheme="green" onClick={addRow}>ADD</Button>
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
            Save
          </Button>
          <Button
            variant="outline"
            mr={3}
            onClick={onClose}
            isDisabled={isSubmitting || mustAddScheduleNow}
          >
            Close
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
              Delete schedule?
            </AlertDialogHeader>

            <AlertDialogBody>
              {pendingDeleteKey ? (
                <>
                  Are you sure you want to delete <b>{nameForKey(pendingDeleteKey)}</b>?
                  <br />
                  This action cannot be undone.
                </>
              ) : (
                'Are you sure you want to delete this schedule?'
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeConfirm} variant="outline">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={deleteRow} ml={3} isLoading={isSubmitting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
};

export default SettlementModal;
