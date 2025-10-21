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
import { CheckCircleIcon, CloseIcon } from '@chakra-ui/icons';
import { 
  createSettlementScheduler, 
  getSettlementSchedulerList, 
  modifySettlementModel, 
  modifySettlementScheduler, 
  removeSettlementScheduler 
} from '@services/settlements';
import { ISettlementScheduleForm } from '@typescript/form/settlements';
import { ISettlementModel } from '@typescript/services';

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

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  type Day = typeof days[number];
  const DOW_MAP: Record<Day, string> = { Mon:'MON', Tue:'TUE', Wed:'WED', Thu:'THU', Fri:'FRI', Sat:'SAT', Sun:'SUN' };
  const REV_DOW_MAP: Record<string, Day> = { MON:'Mon', TUE:'Tue', WED:'Wed', THU:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun' };

  const DEFAULT_NAME = 'Settlement Window Scheduler';
  const DEFAULT_DESC = 'Auto-close settlement windows';

  const jobKeyFor = (key: string) => {
    const { time, zoneId } = splitKey(key);
    console.log(time, zoneId)
    // Make job unique across (time + offset)
    return `settlement-window-${settlementModel.settlementModelId}-${time.replace(':','')}-${zoneId.replace(':','')}`;
  };

  const [rows, setRows] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<Day>>>({
    // Example Format
    // '09:00': new Set<Day>(['Wed', 'Sat']),
    // '09:30': new Set<Day>([]),
    // '10:00': new Set<Day>(['Mon', 'Wed', 'Sat']),
  })
  
  const [newHour, setNewHour] = useState('09');
  const [newMinute, setNewMinute] = useState('00');
  const [selectedTz, setSelectedTz] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoCloseWindow, setAutoCloseWindow] = useState<boolean>(settlementModel.autoCloseWindow);
  
  const [rowIdMap, setRowIdMap] = useState<Record<string, string | undefined>>({});
  
  const normalizeTime = (h: string, m: string) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  const normalizeOffset = (s: string): string | null => {
    const m = s.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return null;
    const sign = m[1], hh = String(+m[2]).padStart(2, '0'), mm = String(m[3] ?? '00').padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  };


  const getOffsetForZone = (timeZone: string): string => {

    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit', minute: '2-digit'
    });
    const parts = fmt.formatToParts(new Date());
    const offPart = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
    const norm = normalizeOffset(offPart.replace('GMT', '').replace('UTC', ''));
    if (norm) return norm;

    return '+00:00';
  };

  const currentOffset = useMemo(() => getOffsetForZone(selectedTz), [selectedTz]);
  
  const hasAnyActiveSchedule = useMemo(
    () => rows.some((k) => (matrix[k]?.size ?? 0) > 0),
    [rows, matrix]
  );

  const getZones = (): string[] => {
      const zones = Intl.supportedValuesOf('timeZone') as string[];
      return zones;
  };

  const makeKey = (time: string, offset: string) => `${time}|${offset}`;
  const splitKey = (key: string) => {
    const [time, zoneId] = key.split('|');
    return { time, zoneId };
  };

  useEffect(() => {
    setAutoCloseWindow(!!settlementModel.autoCloseWindow);
  }, [settlementModel?.autoCloseWindow]);

  const tzOptions = useMemo(() => {
    const list = getZones();
    return list.map((tz) => {
      const off = getOffsetForZone(tz);
      return { tz, off, label: `(${off} ${tz})` };
    });
  }, []);

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

    return () => { cancelled = true; };
  }, [isOpen, settlementModel.settlementModelId]);

  const buildCronForKey = (key: string, setOverride?: Set<Day>): { cron: string | null, zoneId: string } => {
    const { time, zoneId } = splitKey(key);

    const set = setOverride ?? matrix[key];
    
    if (!set || set.size === 0) return { cron: null, zoneId };
    
    const [hh, mm] = time.split(':');
    const days = Array.from(set);
    
    if (!days.length) return { cron: null, zoneId };
    
    const dow = days.map(d => DOW_MAP[d]).join(',');
    
    return { cron: `0 ${mm} ${hh} ? * ${dow}`, zoneId };
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
      });
      setAutoCloseWindow(true);
      // tell parent so it updates its copy (table/list)
      onUpdated?.({ ...settlementModel, autoCloseWindow: true });
      settlementModel.autoCloseWindow = true;

      toast({
        status: 'success',
        title: 'Auto-close enabled',
        description: 'Model is now configured to close windows automatically.',
      });
    }
  };
  
  const persistRow = async (key: string, nextSet?: Set<Day>) => {
    const { cron, zoneId } = buildCronForKey(key, nextSet);
    const { time } = splitKey(key);
    const payload: ISettlementScheduleForm = {
      settlementModelId: settlementModel.settlementModelId,
      name: jobKeyFor(key),
      // jobName: jobKeyFor(key),
      description: DEFAULT_DESC,
      cronExpression: cron ?? '',
      zoneId
    };

    const zoneOk = /^[+-]\d{2}:\d{2}$/.test(payload.zoneId);
    if (!zoneOk) payload.zoneId = '+00:00';

    try {
      setIsSubmitting(true);
      
      await ensureAutoCloseEnabled();

      if (cron) {
        if (!rowIdMap[key]) { // New Row
          await createSettlementScheduler(payload);
          await refreshSchedules(); 
          toast({ status: 'success', title: 'Created', description: `${key} saved.` });
        } else {
          await modifySettlementScheduler({
            ...payload,
            active: true,
            schedulerConfigId: rowIdMap[key] as string
          });
          await refreshSchedules();
          toast({ status: 'success', title: 'Updated', description: `${key} updated.` });
        }
      } else {
        const sid = rowIdMap[key];
        if (sid) {
          await removeSettlementScheduler({ 
            settlementModelId: settlementModel.settlementModelId,
            schedulerConfigId: sid 
          });
          await refreshSchedules();
          toast({ status: 'info', title: 'Removed', description: `${time} cleared.` });
        }
      }
    } catch (e: any) {
      const msg = e?.default_error_message || e?.description || 'Failed to save schedule.';
      toast({ status: 'error', title: 'Error', description: String(msg) });
      await refreshSchedules();
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

    const key = makeKey(time, currentOffset);
    if (rows.includes(key)) {
      const lbl = tzOptions.find(z => z.off === currentOffset)?.tz ?? currentOffset;
      toast({ status: 'info', title: 'Duplicate row', description: `${time} ${currentOffset} ${lbl} (Same Timezone) already exists.` });
      return;
    }

    setRows(r => [...r, key].sort());
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
        await refreshSchedules();
        toast({ status: 'info', title: 'Deleted', description: `${key} removed.` });
      }else {
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

  const refreshSchedules = async () => {
    const resp = await getSettlementSchedulerList(settlementModel.settlementModelId);
    const objList: any[] = Array.isArray(resp?.settlementSchedulerList) ? resp.settlementSchedulerList : [];

    const nextRows = new Set<string>();
    const nextMatrix: Record<string, Set<Day>> = {};
    const nextIds: Record<string, string | undefined> = {};

    if (objList.length) {
      for (const it of objList) {
        
        const ex = it?.cronExpression as string | undefined;
        const zid = String(it?.zoneId ?? '+00:00');

        if (!ex) continue;
        
        const p = parseQuartzCron(ex);
        
        if (!p) continue;
        
        const key = makeKey(p.time, zid);
        nextRows.add(key);
        
        if (!nextMatrix[key]){
          nextMatrix[key] = new Set<Day>();
        }
        
        p.dayList.forEach((d) => nextMatrix[key].add(d));
        
        if (it?.schedulerConfigId) {
          nextIds[key] = String(it.schedulerConfigId);
        }
      }
    }

    setRows(Array.from(nextRows).sort((a, b) => a.localeCompare(b)));
    setMatrix(nextMatrix);
    setRowIdMap(nextIds);
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
    const prevSet = matrix[key] ?? new Set<Day>();
    const newSet = new Set<Day>(prevSet);
    if (newSet.has(day)) newSet.delete(day); else newSet.add(day);

    setMatrix((prev) => ({ ...prev, [key]: newSet }));

    await persistRow(key, newSet);
  };

  const mustAddScheduleNow = autoCloseWindow && !hasAnyActiveSchedule;
  
  const handleAutoCloseToggle = async (checked: boolean) => {
    setAutoCloseWindow(checked);

    const payload = {
      settlementModelId: settlementModel.settlementModelId,
      name: settlementModel.name,
      modelType: settlementModel.type,
      currencyID: (settlementModel.currencyId ?? ''),
      active: true,
      autoCloseWindow: checked
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
        });
        onUpdated?.({ ...settlementModel, autoCloseWindow: false });
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
        // Notify Back the Settlement List page... that model is changed!
        onUpdated?.({
          ...settlementModel,
          autoCloseWindow: checked,
        });
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
                        <Text fontWeight="semibold">Close Window Automatically: </Text>
                        <Switch
                          ml="2"
                          isChecked={autoCloseWindow}
                          colorScheme="green"
                          onChange={(e) => handleAutoCloseToggle(e.target.checked)}
                          />
                          {mustAddScheduleNow && (
                            <Box mt={2}>
                              <Box
                                border="1px solid"
                                borderColor="orange.300"
                                bg="orange.50"
                                color="orange.800"
                                rounded="md"
                                p={3}
                                ml={2}
                                fontSize="sm"
                              >
                                Auto-close is ON, but there’s no active schedule yet. <br />
                                Add a time row and tick at least one day to enable saving.
                              </Box>
                            </Box>
                          )}
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
                              <Th w="120px" textAlign="center">Hr/Day</Th>
                              {days.map((d) => (
                                <Th key={d} textAlign="center">{d}</Th>
                              ))}
                              <Th w="100px" textAlign="center"> </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {rows.slice().sort().map((key) => {
                              const { time, zoneId } = splitKey(key);
                              
                              const labelTz = tzOptions.find(z => z.off === zoneId)?.tz;
                              
                              const display = labelTz ? `${time} (${zoneId} ${labelTz})` : `${time} (${zoneId})`;

                              return (
                                <Tr key={key}>
                                  <Td bg="green.50" fontWeight="semibold" textAlign="center">{display}</Td>
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
                                    <Button size="sm" colorScheme="red" variant="solid" onClick={() => requestDeleteRow(key)} leftIcon={<CloseIcon boxSize={2.5} />}>
                                      DELETE
                                    </Button>
                                  </Td>
                                </Tr>
                              );
                            })}

                            <Tr>
                              <Td bg="gray.100" fontWeight="semibold" textAlign="center">Select Hr</Td>

                              <Td colSpan={days.length + 1}>
                                <HStack spacing={3}>
                                  <Select
                                    value={newHour}
                                    onChange={(e) => setNewHour(e.target.value)}
                                    size="sm"
                                    w="80px"
                                  >
                                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                                      <option key={h} value={h}>{h}</option>
                                    ))}
                                  </Select>

                                  <Select
                                    value={newMinute}
                                    onChange={(e) => setNewMinute(e.target.value)}
                                    size="sm"
                                    w="80px"
                                  >
                                    {['00', '30'].map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </Select>
                          
                                  <Select
                                    value={selectedTz}
                                    onChange={(e) => setSelectedTz(e.target.value)}
                                    flex="1"
                                    maxW="60%"
                                    size="sm"
                                  >
                                    {tzOptions.map(opt => (
                                      <option key={opt.tz} value={opt.tz}>{opt.label}</option>
                                    ))}
                                  </Select>
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
                  <Button variant="outline" mr={3} onClick={onClose} isDisabled={isSubmitting || mustAddScheduleNow}>Close</Button>
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
                        {pendingDeleteKey
                          ? `Are you sure you want to delete ${pendingDeleteKey}? This action cannot be undone.`
                          : 'Are you sure you want to delete this schedule?'}
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
