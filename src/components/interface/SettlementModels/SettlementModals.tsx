import React, { useState, useEffect, useMemo } from 'react';
import {
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
    Table, Thead, Tr, Th, Td, Tbody
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
  const [selectedTz, setSelectedTz] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  type Day = typeof days[number];
  const DOW_MAP: Record<Day, string> = { Mon:'MON', Tue:'TUE', Wed:'WED', Thu:'THU', Fri:'FRI', Sat:'SAT', Sun:'SUN' };
  const REV_DOW_MAP: Record<string, Day> = { MON:'Mon', TUE:'Tue', WED:'Wed', THU:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun' };

  const DEFAULT_NAME = 'Settlement Window Scheduler';
  const DEFAULT_DESC = 'Auto-close settlement windows';
  const DEFAULT_ZONE = '+00:00';
  
  const jobKeyForTime = (time: string) => `settlement-window-${settlementModel?.settlementModelId}-${time.replace(':', '')}`;
  
  
  const [rows, setRows] = useState<string[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Set<Day>>>({
    // Example Format
    // '09:00': new Set<Day>(['Wed', 'Sat']),
    // '09:30': new Set<Day>([]),
    // '10:00': new Set<Day>(['Mon', 'Wed', 'Sat']),
  })
  
  const [newHour, setNewHour] = useState('09');
  const [newMinute, setNewMinute] = useState('00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [autoCloseWindow, setAutoCloseWindow] = useState<boolean>(settlementModel.autoCloseWindow);
  
  // just a list of scheduleid list
  const [rowIdMap, setRowIdMap] = useState<Record<string, string | undefined>>({});
  
  const normalizeTime = (h: string, m: string) => `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
  const normalizeOffset = (s: string): string | null => {
    const m = s.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return null;
    const sign = m[1];
    const hh = String(Number(m[2])).padStart(2, '0');
    const mm = String(m[3] ?? '00').padStart(2, '0');
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

  const [zoneId, setZoneId] = useState<string>(() => getOffsetForZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));


  const getZones = (): string[] => {
      const zones = Intl.supportedValuesOf('timeZone') as string[];
      return zones;
  };
  const toast = useToast();

  useEffect(() => {
    setAutoCloseWindow(!!settlementModel.autoCloseWindow);
  }, [settlementModel?.autoCloseWindow]);

  useEffect(() => {
    const off = getOffsetForZone(selectedTz);
    setZoneId(off);
  }, [selectedTz]);

  const tzOptions = useMemo(() => {
    const list = getZones();
    return list.map((tz) => {
      const off = getOffsetForZone(tz);
      return { tz, off, label: `(${off} ${tz})` };
    });
    // It’s okay that this recomputes on open; if perf is a concern, memoize globally.
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

  const buildCronForTime = (time: string, setOverride?: Set<Day>): string | null => {
    const set = setOverride ?? matrix[time];
    if (!set || set.size === 0) return null;
    const [hh, mm] = time.split(':');
    const dowTokens = Array.from(set).map((d) => DOW_MAP[d]).filter(Boolean);
    if (!dowTokens.length) return null;
    return `0 ${mm} ${hh} ? * ${dowTokens.join(',')}`; // ss mm HH ? * DOW[,DOW...]
  };

  const persistRow = async (time: string, nextSet?: Set<Day>) => {
    const cronExpression = buildCronForTime(time, nextSet);
    const payload: ISettlementScheduleForm = {
      settlementModelId: settlementModel.settlementModelId,
      name: DEFAULT_NAME,
      jobName: jobKeyForTime(time),
      description: DEFAULT_DESC,
      cronExpression: cronExpression ?? '',
      zoneId: zoneId
    };

    const zoneOk = /^[+-]\d{2}:\d{2}$/.test(payload.zoneId);
    if (!zoneOk) payload.zoneId = '+00:00';

    try {
      setIsSubmitting(true);
      if (cronExpression) {
        if (!rowIdMap[time]) { // New Row
          await createSettlementScheduler(payload);
          await refreshSchedules(); 
          toast({ status: 'success', title: 'Created', description: `${time} saved.` });
        } else {
          await modifySettlementScheduler({
            ...payload,
            active: true,
            schedulerConfigId: rowIdMap[time] as string
          });
          await refreshSchedules();
          toast({ status: 'success', title: 'Updated', description: `${time} updated.` });
        }
      } else {
        const sid = rowIdMap[time];
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
    if (rows.includes(time)) {
      toast({ status: 'info', title: 'Duplicate time', description: `${time} already exists.` });
      return;
    }
    setRows((r) => [...r, time].sort((a, b) => a.localeCompare(b)));
    setMatrix((m) => ({ ...m, [time]: new Set<Day>() }));
  };

  const deleteRow = async (time: string) => {
    try {
      setIsSubmitting(true);
      const sid = rowIdMap[time];
      if (sid) {
        await removeSettlementScheduler({ settlementModelId: settlementModel.settlementModelId, schedulerConfigId: sid } as any);
        await refreshSchedules();
        toast({ status: 'info', title: 'Deleted', description: `${time} removed.` });
      }
    } catch (e: any) {
      const msg = e?.default_error_message || e?.description || 'Failed to remove schedule.';
      toast({ status: 'error', title: 'Error', description: String(msg) });
    } finally {
      setIsSubmitting(false);
    }
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
      if (!ex) continue;
      const p = parseQuartzCron(ex);
      if (!p) continue;
      nextRows.add(p.time);
      if (!nextMatrix[p.time]) nextMatrix[p.time] = new Set<Day>();
      p.dayList.forEach((d) => nextMatrix[p.time].add(d));
      if (it?.schedulerConfigId) nextIds[p.time] = String(it.schedulerConfigId);
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

  const toggleCell = async (time: string, day: Day) => {
    const prevSet = matrix[time] ?? new Set<Day>();
    const newSet = new Set<Day>(prevSet);
    if (newSet.has(day)) newSet.delete(day); else newSet.add(day);

    setMatrix((prev) => ({ ...prev, [time]: newSet }));

    await persistRow(time, newSet);
  };
  
  const handleAutoCloseToggle = async (checked: boolean) => {
    // Build payload per backend contract
    const payload = {
      settlementModelId: settlementModel.settlementModelId,
      name: settlementModel.name,
      modelType: settlementModel.type,
      currencyID: (settlementModel.currencyId ?? ''),
      active: true,
      autoCloseWindow: checked
    };
    try {
      // Sanity: URL format check (http/https) is handled at routes; we just call service
      await modifySettlementModel(payload);
      setAutoCloseWindow(checked);

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
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="left" fontSize="xl" fontWeight="bold" textDecoration="underline">
                    Settlement Models
                </ModalHeader>
                <ModalCloseButton />

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
                        <Table size="sm" variant="simple">
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
                            {rows
                              .slice()
                              .sort((a, b) => a.localeCompare(b))
                              .map((time) => (
                              <Tr key={time}>
                                <Td bg="green.50" fontWeight="semibold" textAlign="center">{time}</Td>
                                {days.map((d) => {
                                  const active = matrix[time]?.has(d) ?? false;
                                  return (
                                    <Td
                                      key={`${time}-${d}`}
                                      textAlign="center"
                                      cursor={isSubmitting ? 'not-allowed' : 'pointer'}
                                      onClick={() => !isSubmitting && toggleCell(time, d)}
                                    >
                                      {matrix[time]?.has(d) ? <CheckCircleIcon /> : null}
                                    </Td>
                                  );
                                })}
                                <Td textAlign="center">
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="solid"
                                    onClick={() => deleteRow(time)}
                                    leftIcon={<CloseIcon boxSize={2.5} />}
                                  >
                                    DELETE
                                  </Button>
                                </Td>
                              </Tr>
                            ))}

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
                  <Button variant="outline" mr={3} onClick={onClose} isDisabled={isSubmitting}>Close</Button>
                  <Button colorScheme="blue" isDisabled>Save</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SettlementModal;
