// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { allTimezones, type ITimezoneOption, useTimezoneSelect } from 'react-timezone-select';
import { Column, CellProps, useSortBy, useTable } from 'react-table';
import { FaRegEdit } from 'react-icons/fa';
import { FiSlash } from 'react-icons/fi';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  RevenueCard,
  RevenuePageShell,
  RevenueSearchInput,
  RevenueSectionLabel,
  RevenueTableContainer,
  RevenueToolbar
} from '@pages/RevenueSharing/components';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { useGetRevenueConfigList, useGetRevenuePartyList } from '@hooks/services/revenue-sharing';
import { createRevenueApprovalRequest } from '@services/revenue-sharing';
import { type RootState } from '@store';
import CustomSelect, { type OptionType } from '@components/interface/CustomSelect';
import {
  type IApiErrorResponse,
  type IRevenueConfig,
  type IRevenueConfigFormValues,
  type IRevenueParty,
  type IRevenueSplitPercentages,
  type RevenueConfigRequestedAction
} from '@typescript/services';

const EMPTY_PERCENTAGES: IRevenueSplitPercentages = {
  GOL: '',
  MINISTRY: '',
  '3PP': '',
  SENDING_DFSP: ''
};

const EMPTY_FORM: IRevenueConfigFormValues = {
  taxCodeId: '',
  taxCodeDescription: '',
  responsibleMinistryCode: '',
  thirdPartyProviderCode: '',
  category: 'DOMESTIC',
  effectiveDate: '',
  effectiveTimezone: 'GMT+00:00',
  percentages: EMPTY_PERCENTAGES
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  CURRENT: { bg: 'green.50', color: 'green.700' },
  FUTURE: { bg: 'purple.100', color: 'purple.700' },
  INACTIVE: { bg: 'gray.100', color: 'gray.700' }
};

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  DOMESTIC: { bg: 'purple.100', color: 'purple.700' },
  CUSTOMS: { bg: 'orange.100', color: 'orange.700' },
  CROSS_BORDER: { bg: 'blue.50', color: 'blue.700' }
};

type RevenueTimezoneOption = OptionType & { offset: string };

const getOffsetForZone = (timeZone: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit'
  });
  const offsetText = formatter.formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value ?? '';
  const match = offsetText.replace('GMT', '').replace('UTC', '').match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  const sign = match?.[1] ?? '+';
  const hours = String(Number(match?.[2] ?? '0')).padStart(2, '0');
  const minutes = String(match?.[3] ?? '00').padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

const stripLeadingGMT = (label: string) => label.replace(/^\(GMT[+\-?]\d{1,2}:\d{2}\)\s*/i, '');

const normalizeTimezoneOffset = (timezone?: string) => {
  const value = timezone || 'GMT+00:00';
  if (value.startsWith('GMT')) return value;
  if (value.startsWith('UTC')) return `GMT${value.replace('UTC', '')}`;
  if (/^[+-]\d{2}:\d{2}$/.test(value)) return `GMT${value}`;

  try {
    return `GMT${getOffsetForZone(value)}`;
  } catch {
    return 'GMT+00:00';
  }
};

const getRevenuePartyCode = (party: IRevenueParty) => party.partyCode || party.partyId || '';

const getRevenuePartyName = (party: IRevenueParty) => party.partyName || party.name || '';

const getRevenuePartyType = (party: IRevenueParty) => party.partyType || party.type || '';

const isResponsibleMinistry = (party: IRevenueParty) =>
  getRevenuePartyType(party) === 'RESPONSIBLE_MINISTRY' || getRevenuePartyType(party) === 'Responsible Ministry';

const isThirdParty = (party: IRevenueParty) =>
  getRevenuePartyType(party) === 'THIRD_PARTY' || getRevenuePartyType(party) === '3rd Party';

const normalizeDateTime = (value?: string) => {
  if (!value) return '';
  const dateTime = value.replace('T', ' ').slice(0, 19);
  return dateTime.length === 16 ? `${dateTime}:00` : dateTime;
};

const toDateTimeInputValue = (value?: string) => {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
};

const getCurrentDateTimeInputValue = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatDate = (value?: string | number | null) => {
  if (!value) return '-';
  if (typeof value === 'string') return value.split('T')[0].split(' ')[0];
  const timestamp = value < 10000000000 ? value * 1000 : value;
  return new Date(timestamp).toISOString().split('T')[0];
};

const formatDateTime = (value?: string | number | null) => {
  if (!value) return '-';
  if (typeof value === 'string') return value.replace('T', ' ').replace('Z', '').slice(0, 19);
  const timestamp = value < 10000000000 ? value * 1000 : value;
  return new Date(timestamp).toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
};

const toPercentageNumber = (value?: number | string) => Number(value || 0);

const getPercentageTotal = (percentages: IRevenueSplitPercentages) =>
  toPercentageNumber(percentages.GOL) +
  toPercentageNumber(percentages.MINISTRY) +
  toPercentageNumber(percentages['3PP']) +
  toPercentageNumber(percentages.SENDING_DFSP);

const getConfigPercentages = (config: IRevenueConfig): IRevenueSplitPercentages => ({
  GOL: Number(config.golPercentage ?? config.percentages?.GOL ?? 0),
  MINISTRY: Number(config.ministryPercentage ?? config.percentages?.MINISTRY ?? 0),
  '3PP': Number(config.thirdPartyPercentage ?? config.percentages?.['3PP'] ?? 0),
  SENDING_DFSP: Number(config.sendingDfspPercentage ?? config.percentages?.SENDING_DFSP ?? 0)
});

const getRevenueConfigField = (config: IRevenueConfig, fieldNames: string[]) => {
  const record = config as unknown as Record<string, unknown>;
  return fieldNames.find((fieldName) => {
    const value = record[fieldName];
    return value !== undefined && value !== null && value !== '';
  });
};

const getRevenueConfigLastUpdated = (config: IRevenueConfig) => {
  const record = config as unknown as Record<string, unknown>;
  const fieldName = getRevenueConfigField(config, [
    'lastUpdatedDate',
    'lastUpdateDate',
    'lastUpdatedAt',
    'lastUpdateAt',
    'lastModifiedDate',
    'lastModifiedAt',
    'modifiedDate',
    'modifiedAt',
    'updatedDate',
    'updatedAt',
    'updateDate',
    'createdDate',
    'createdAt'
  ]);

  return fieldName ? record[fieldName] as string | number | null : null;
};

const getRevenueConfigModifiedBy = (config: IRevenueConfig) => {
  const record = config as unknown as Record<string, unknown>;
  const fieldName = getRevenueConfigField(config, [
    'modifiedBy',
    'modifiedUser',
    'modifiedByUser',
    'modifiedByUsername',
    'lastModifiedBy',
    'updatedBy',
    'lastUpdatedBy',
    'createdBy',
    'maker',
    'makerId',
    'username',
    'userName'
  ]);

  return fieldName ? String(record[fieldName]) : '';
};

const getRevenueConfigEffectiveDate = (config: IRevenueConfig) => {
  const record = config as unknown as Record<string, unknown>;
  const fieldName = getRevenueConfigField(config, [
    'effectiveDate',
    'effectiveDateDisplay',
    'effective_date_display',
    'effective_date'
  ]);

  return fieldName ? record[fieldName] as string | number | null : null;
};

const getRevenueConfigEffectiveTimezone = (config: IRevenueConfig) => {
  const record = config as unknown as Record<string, unknown>;
  const fieldName = getRevenueConfigField(config, [
    'effectiveTimezone',
    'effective_timezone',
    'timezone'
  ]);

  return fieldName ? String(record[fieldName]) : '';
};

const RevenueSplitBar = ({ percentages }: { percentages: IRevenueSplitPercentages }) => {
  const total = Math.max(getPercentageTotal(percentages), 1);
  const segments = [
    { key: 'GOL', value: percentages.GOL, color: 'purple.400' },
    { key: 'MINISTRY', value: percentages.MINISTRY, color: 'green.500' },
    { key: '3PP', value: percentages['3PP'], color: 'blue.500' },
    { key: 'SENDING_DFSP', value: percentages.SENDING_DFSP, color: 'orange.400' }
  ];

  return (
    <HStack spacing={0} w="full" h="10px" rounded="full" overflow="hidden" bg="gray.100">
      {segments.map((segment) => (
        <Box
          key={segment.key}
          h="full"
          bg={segment.color}
          w={String(Math.max((toPercentageNumber(segment.value) / total) * 100, segment.value ? 2 : 0)) + '%'}
        />
      ))}
    </HStack>
  );
};

const createPayload = (
  requestedAction: RevenueConfigRequestedAction,
  formValues: IRevenueConfigFormValues
) => ({
  requestedAction,
  ...(formValues.revenueConfigId ? { revenueConfigId: formValues.revenueConfigId } : {}),
  taxCodeId: formValues.taxCodeId,
  taxCodeDescription: formValues.taxCodeDescription,
  responsibleMinistryCode: formValues.responsibleMinistryCode,
  thirdPartyProviderCode: formValues.thirdPartyProviderCode,
  category: formValues.category,
  effectiveDate: normalizeDateTime(formValues.effectiveDate),
  effectiveTimezone: normalizeTimezoneOffset(formValues.effectiveTimezone),
  percentages: {
    GOL: toPercentageNumber(formValues.percentages.GOL),
    MINISTRY: toPercentageNumber(formValues.percentages.MINISTRY),
    '3PP': toPercentageNumber(formValues.percentages['3PP']),
    SENDING_DFSP: toPercentageNumber(formValues.percentages.SENDING_DFSP)
  }
});

const fromConfig = (config: IRevenueConfig): IRevenueConfigFormValues => ({
  revenueConfigId: config.revenueConfigId,
  taxCodeId: config.taxCodeId,
  taxCodeDescription: config.taxCodeDescription,
  responsibleMinistryCode: config.responsibleMinistryCode,
  thirdPartyProviderCode: config.thirdPartyProviderCode || '',
  category: config.category,
  effectiveDate: toDateTimeInputValue(config.effectiveDate),
  effectiveTimezone: normalizeTimezoneOffset(config.effectiveTimezone),
  percentages: getConfigPercentages(config)
});

const RevenueConfig = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>((state) => state.app.selectedTimezone);
  const selectedTZString = selectedTimezone.value;
  const { options: timezoneSelectOptions } = useTimezoneSelect({
    labelStyle: 'original',
    timezones: allTimezones
  });
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formValues, setFormValues] = useState<IRevenueConfigFormValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IRevenueConfig | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetRevenueConfigList({
    refetchOnWindowFocus: false
  });
  const { data: revenueParties } = useGetRevenuePartyList({
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (isError) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_fetch_revenue_configs'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [error, isError, t, toast]);

  const configs = useMemo(() => data || [], [data]);
  const responsibleMinistries = useMemo(
    () => (revenueParties || []).filter(isResponsibleMinistry),
    [revenueParties]
  );
  const thirdPartyProviders = useMemo(
    () => (revenueParties || []).filter(isThirdParty),
    [revenueParties]
  );
  const timezoneOptions = useMemo<RevenueTimezoneOption[]>(
    () => timezoneSelectOptions.map((option) => {
      const timezone = String(option.value);
      const offset = getOffsetForZone(timezone);
      return {
        value: timezone,
        label: `(GMT${offset}) ${stripLeadingGMT(String(option.label))}`,
        offset: `GMT${offset}`
      };
    }),
    [timezoneSelectOptions]
  );
  const selectedTimezoneOption = useMemo(
    () => timezoneOptions.find((option) => option.value === formValues.effectiveTimezone) ||
      timezoneOptions.find((option) => option.offset === normalizeTimezoneOffset(formValues.effectiveTimezone)) ||
      null,
    [formValues.effectiveTimezone, timezoneOptions]
  );
  const filteredConfigs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return configs;

    return configs.filter((config) =>
      [
        config.taxCodeId,
        config.taxCodeDescription,
        config.category,
        config.responsibleMinistryName,
        config.responsibleMinistryCode,
        config.thirdPartyProviderName,
        config.thirdPartyProviderCode,
        config.status,
        getRevenueConfigModifiedBy(config),
        getRevenueConfigLastUpdated(config)
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [configs, search]);

  const closeModal = () => {
    setIsOpen(false);
    setIsEdit(false);
    setFormValues(EMPTY_FORM);
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormValues({
      ...EMPTY_FORM,
      effectiveDate: getCurrentDateTimeInputValue(),
      effectiveTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    });
    setIsOpen(true);
  };

  const openEditModal = (config: IRevenueConfig) => {
    setIsEdit(true);
    setFormValues(fromConfig(config));
    setIsOpen(true);
  };

  const normalizePercentageInput = (value: string) => {
    const sanitizedValue = value.replace(/[^\d.]/g, '');
    const [integerPart, ...decimalParts] = sanitizedValue.split('.');

    if (decimalParts.length === 0) return integerPart;

    return integerPart + '.' + decimalParts.join('');
  };

  const getPercentageError = (value: number | string) => {
    const stringValue = String(value ?? '').trim();
    const decimalPart = stringValue.split('.')[1];
    const numericValue = Number(stringValue || 0);

    if (Number.isNaN(numericValue)) return 'Invalid number';
    if (numericValue < 0) return 'Minimum value is 0';
    if (numericValue > 100) return 'Maximum value is 100';
    if (decimalPart && decimalPart.length > 2) return 'Maximum 2 decimal places allowed';

    return '';
  };

  const percentageErrors = useMemo(() => ({
    GOL: getPercentageError(formValues.percentages.GOL),
    MINISTRY: getPercentageError(formValues.percentages.MINISTRY),
    '3PP': getPercentageError(formValues.percentages['3PP']),
    SENDING_DFSP: getPercentageError(formValues.percentages.SENDING_DFSP)
  }), [formValues.percentages]);

  const hasPercentageErrors = Object.values(percentageErrors).some(Boolean);

  const updatePercentage = (key: keyof IRevenueSplitPercentages, value: string) => {
    setFormValues((current) => ({
      ...current,
      percentages: {
        ...current.percentages,
        [key]: normalizePercentageInput(value)
      }
    }));
  };

  const submitApprovalRequest = async (requestedAction: RevenueConfigRequestedAction) => {
    if (!formValues.taxCodeId.trim() || !formValues.taxCodeDescription.trim() || !formValues.responsibleMinistryCode.trim() || !formValues.effectiveDate) {
      toast({
        position: 'top',
        description: t('ui.required_revenue_config_fields_missing'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (hasPercentageErrors) {
      toast({
        position: 'top',
        description: Object.values(percentageErrors).find(Boolean),
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    if (Math.abs(getPercentageTotal(formValues.percentages) - 100) >= 0.001) {
      toast({
        position: 'top',
        description: t('ui.revenue_split_must_total_100'),
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    setIsSaving(true);
    try {
      await createRevenueApprovalRequest(createPayload(requestedAction, formValues));
      toast({
        position: 'top',
        description: t('ui.revenue_config_approval_request_submitted'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      closeModal();
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_submit_revenue_config_approval_request'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (config: IRevenueConfig) => {
    setDeleteTarget(config);
  };

  const closeDeleteDialog = () => {
    if (isSaving) return;
    setDeleteTarget(null);
  };

  const deleteConfig = async () => {
    if (!deleteTarget) return;

    setIsSaving(true);
    try {
      await createRevenueApprovalRequest(createPayload('DELETE_REVENUE_CONFIG', fromConfig(deleteTarget)));
      toast({
        position: 'top',
        description: t('ui.revenue_config_delete_request_submitted'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_submit_revenue_config_approval_request'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Column<IRevenueConfig>[]>(() => [
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">#</Text>,
      id: 'rowNumber',
      accessor: (_row, index) => index + 1,
      Cell: ({ value }: CellProps<IRevenueConfig, number>) => value
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.tax_code')}</Text>,
      accessor: 'taxCodeId',
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => <Text color="gray.700">{value || '-'}</Text>
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.description')}</Text>,
      accessor: 'taxCodeDescription',
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => <Text color="gray.700" textAlign="left">{value || '-'}</Text>
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.category')}</Text>,
      accessor: 'category',
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => {
        const style = CATEGORY_STYLE[value] || CATEGORY_STYLE.DOMESTIC;
        return <Badge bg={style.bg} color={style.color} rounded="full" px={3} py={1} textTransform="capitalize">{value?.replace('_', ' ') || '-'}</Badge>;
      }
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.ministry')}</Text>,
      id: 'ministry',
      accessor: (config) => config.responsibleMinistryName || config.responsibleMinistryCode,
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.third_party_provider_short')}</Text>,
      id: 'thirdPartyProvider',
      accessor: (config) => config.thirdPartyProviderName || config.thirdPartyProviderCode || '-',
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.revenue_split')}</Text>,
      id: 'revenueSplit',
      disableSortBy: true,
      Cell: ({ row }: CellProps<IRevenueConfig>) => <RevenueSplitBar percentages={getConfigPercentages(row.original)} />
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.gol_percent')}</Text>,
      accessor: (config) => getConfigPercentages(config).GOL,
      id: 'golPercent',
      Cell: ({ value }: CellProps<IRevenueConfig, number | string>) => String(value) + '%'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.ministry_percent')}</Text>,
      accessor: (config) => getConfigPercentages(config).MINISTRY,
      id: 'ministryPercent',
      Cell: ({ value }: CellProps<IRevenueConfig, number | string>) => String(value) + '%'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.third_party_percent')}</Text>,
      accessor: (config) => getConfigPercentages(config)['3PP'],
      id: 'thirdPartyPercent',
      Cell: ({ value }: CellProps<IRevenueConfig, number | string>) => String(value) + '%'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.dfsp_percent')}</Text>,
      accessor: (config) => getConfigPercentages(config).SENDING_DFSP,
      id: 'dfspPercent',
      Cell: ({ value }: CellProps<IRevenueConfig, number | string>) => String(value) + '%'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.last_updated')}</Text>,
      id: 'lastUpdatedDate',
      accessor: (config) => formatEpochToTZ(getRevenueConfigLastUpdated(config) || '', selectedTZString),
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.modified_by')}</Text>,
      id: 'modifiedBy',
      accessor: (config) => getRevenueConfigModifiedBy(config),
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => value || '-'
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.effective_date')}</Text>,
      id: 'effectiveDate',
      accessor: (config) => formatDateTime(getRevenueConfigEffectiveDate(config)) + '\n' + (getRevenueConfigEffectiveTimezone(config) || ''),
      Cell: ({ value }: CellProps<IRevenueConfig, string>) => <Text whiteSpace="pre-line">{value || '-'}</Text>
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.status')}</Text>,
      accessor: 'status',
      Cell: ({ value }: CellProps<IRevenueConfig, string | undefined>) => {
        const normalized = value || 'CURRENT';
        const style = STATUS_STYLE[normalized] || STATUS_STYLE.CURRENT;
        return <Badge bg={style.bg} color={style.color} rounded="full" px={3} py={1} textTransform="capitalize">{normalized.toLowerCase()}</Badge>;
      }
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.action')}</Text>,
      id: 'action',
      disableSortBy: true,
      Cell: ({ row }: CellProps<IRevenueConfig>) => {
        const isInactive = String(row.original.status || '').toUpperCase() === 'INACTIVE';
        const isActionDisabled = !hasActionPermission("CreateRevenueApprovalRequest") || isInactive;

        return (
          <HStack justify="center" spacing={2}>
            <Tooltip label={t('ui.edit')} placement="top">
              <IconButton
                aria-label={t('ui.edit')}
                icon={<FaRegEdit />}
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(row.original)}
                isDisabled={isActionDisabled}
              />
            </Tooltip>
            <Tooltip label={t('ui.delete')} placement="top">
              <IconButton
                aria-label={t('ui.delete')}
                icon={<FiSlash />}
                size="sm"
                variant="ghost"
                onClick={() => openDeleteDialog(row.original)}
                isDisabled={isActionDisabled || isSaving}
              />
            </Tooltip>
          </HStack>
        );
      }
    }
  ], [isSaving, selectedTZString, t]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: filteredConfigs,
      autoResetSortBy: false
    },
    useSortBy
  );

  const isTableLoading = isLoading || isFetching;
  const percentageTotal = getPercentageTotal(formValues.percentages);
  const isRevenueConfigFormValid = Boolean(
    formValues.taxCodeId.trim() &&
    formValues.taxCodeDescription.trim() &&
    formValues.responsibleMinistryCode.trim() &&
    formValues.category &&
    formValues.effectiveDate &&
    formValues.effectiveTimezone
  );
  const isRevenueSplitValid = !hasPercentageErrors && Math.abs(percentageTotal - 100) < 0.001;

  return (
    <RevenuePageShell title={t('ui.revenue_config')}>
      <RevenueCard
        title={t('ui.active_revenue_rules')}
        description={t('ui.active_revenue_rules_description')}
      >
        <RevenueToolbar
          action={
            hasActionPermission("CreateRevenueApprovalRequest") ? (
              <Button colorScheme="blue" onClick={openCreateModal}>{t('ui.add_rule')}</Button>
            ) : null
          }
        >
          <RevenueSearchInput
            value={search}
            placeholder={t('ui.search_service')}
            onChange={setSearch}
          />
        </RevenueToolbar>

        <RevenueTableContainer>
            <Table variant="simple" {...getTableProps()}>
              <Thead bg="gray.100">
                {headerGroups.map((headerGroup) => {
                  const headerGroupProps = headerGroup.getHeaderGroupProps();
                  const { key: headerGroupKey, ...headerGroupRest } = headerGroupProps;
                  return (
                    <Tr key={headerGroupKey} {...headerGroupRest}>
                      {headerGroup.headers.map((column) => {
                        const headerProps = column.getHeaderProps(column.disableSortBy ? undefined : column.getSortByToggleProps());
                        const { key: headerKey, ...headerRest } = headerProps;
                        return (
                          <Th key={headerKey} px={3} textAlign="center" textTransform="none" borderColor="gray.100" {...headerRest}>
                            <HStack align="center" justify="center" spacing="1">
                              {column.render('Header')}
                              {column.disableSortBy ? null : (
                                <VStack display="inline-flex" align="center" spacing={0}>
                                  <Icon as={IoChevronUp} color={!column.isSorted ? 'gray.400' : !column.isSortedDesc ? 'gray.700' : 'gray.400'} />
                                  <Icon as={IoChevronDown} color={!column.isSorted ? 'gray.400' : column.isSortedDesc ? 'gray.700' : 'gray.400'} />
                                </VStack>
                              )}
                            </HStack>
                          </Th>
                        );
                      })}
                    </Tr>
                  );
                })}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {isTableLoading ? (
                  <Tr>
                    <Td colSpan={columns.length} py={12}>
                      <Center>
                        <VStack spacing={3}>
                          <Spinner color="blue.500" />
                          <Text color="gray.600" fontSize="sm">{t('ui.loading_revenue_configs')}</Text>
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                ) : rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} py={10} textAlign="center" color="gray.600">{t('ui.no_revenue_configs_found')}</Td>
                  </Tr>
                ) : (
                  rows.map((row) => {
                    prepareRow(row);
                    const rowProps = row.getRowProps();
                    const { key: rowKey, ...rowRest } = rowProps;
                    return (
                      <Tr key={rowKey} fontSize="sm" _hover={{ bg: 'muted.50' }} {...rowRest}>
                        {row.cells.map((cell) => {
                          const cellProps = cell.getCellProps();
                          const { key: cellKey, ...cellRest } = cellProps;
                          return <Td key={cellKey} py={2} px={3} textAlign="center" borderColor="gray.100" {...cellRest}>{cell.render('Cell')}</Td>;
                        })}
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
        </RevenueTableContainer>
      </RevenueCard>

      <Modal isOpen={isOpen} onClose={closeModal} isCentered>
        <ModalOverlay bg="blackAlpha.500" />
        <ModalContent w={{ base: "calc(100vw - 32px)", md: "720px" }} maxW="720px" rounded="xl" boxShadow="2xl">
          <ModalHeader pb={3}>{isEdit ? t('ui.edit_rule') : t('ui.add_rule')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5} maxH="calc(100vh - 220px)" overflowY="auto" pr={5}>
            <VStack spacing={4} align="stretch">
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('ui.tax_code_id')}</FormLabel>
                  <Input placeholder="e.g. 071" value={formValues.taxCodeId} onChange={(event) => setFormValues((current) => ({ ...current, taxCodeId: event.target.value }))} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('ui.category')}</FormLabel>
                  <Select value={formValues.category} onChange={(event) => setFormValues((current) => ({ ...current, category: event.target.value }))}>
                    <option value="DOMESTIC">Domestic</option>
                    <option value="CUSTOMS">Customs</option>
                  </Select>
                </FormControl>
              </Grid>

              <FormControl isRequired>
                <FormLabel fontSize="sm">{t('ui.tax_code_description_label')}</FormLabel>
                <Input placeholder="e.g. Passport Application Fee" value={formValues.taxCodeDescription} onChange={(event) => setFormValues((current) => ({ ...current, taxCodeDescription: event.target.value }))} />
              </FormControl>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('ui.responsible_ministry')}</FormLabel>
                  <Select value={formValues.responsibleMinistryCode} onChange={(event) => setFormValues((current) => ({ ...current, responsibleMinistryCode: event.target.value }))}>
                    <option value="">{t('ui.select_responsible_ministry')}</option>
                    {responsibleMinistries.map((party) => (
                      <option key={getRevenuePartyCode(party)} value={getRevenuePartyCode(party)}>{getRevenuePartyName(party)}</option>
                    ))}
                    {formValues.responsibleMinistryCode && !responsibleMinistries.some((party) => getRevenuePartyCode(party) === formValues.responsibleMinistryCode) && (
                      <option value={formValues.responsibleMinistryCode}>{formValues.responsibleMinistryCode}</option>
                    )}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">{t('ui.third_party_provider')}</FormLabel>
                  <Select value={formValues.thirdPartyProviderCode} onChange={(event) => setFormValues((current) => ({ ...current, thirdPartyProviderCode: event.target.value }))}>
                    <option value="">No third party provider</option>
                    {thirdPartyProviders.map((party) => (
                      <option key={getRevenuePartyCode(party)} value={getRevenuePartyCode(party)}>{getRevenuePartyName(party)}</option>
                    ))}
                    {formValues.thirdPartyProviderCode && !thirdPartyProviders.some((party) => getRevenuePartyCode(party) === formValues.thirdPartyProviderCode) && (
                      <option value={formValues.thirdPartyProviderCode}>{formValues.thirdPartyProviderCode}</option>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <RevenueSectionLabel>{t('ui.revenue_split_configuration')}</RevenueSectionLabel>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isInvalid={Boolean(percentageErrors.GOL)}>
                  <FormLabel fontSize="sm">{t('ui.gol_gra_percent')}</FormLabel>
                  <NumberInput min={0} max={100} precision={2} step={0.01} value={formValues.percentages.GOL} onChange={(value) => updatePercentage('GOL', value)}>
                    <NumberInputField placeholder="e.g. 55.00" />
                  </NumberInput>
                  <FormErrorMessage>{percentageErrors.GOL}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={Boolean(percentageErrors.MINISTRY)}>
                  <FormLabel fontSize="sm">{t('ui.responsible_ministry_percent')}</FormLabel>
                  <NumberInput min={0} max={100} precision={2} step={0.01} value={formValues.percentages.MINISTRY} onChange={(value) => updatePercentage('MINISTRY', value)}>
                    <NumberInputField placeholder="e.g. 5.00" />
                  </NumberInput>
                  <FormErrorMessage>{percentageErrors.MINISTRY}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={Boolean(percentageErrors['3PP'])}>
                  <FormLabel fontSize="sm">{t('ui.third_party_percent')}</FormLabel>
                  <NumberInput min={0} max={100} precision={2} step={0.01} value={formValues.percentages['3PP']} onChange={(value) => updatePercentage('3PP', value)}>
                    <NumberInputField placeholder="e.g. 35.00" />
                  </NumberInput>
                  <FormErrorMessage>{percentageErrors['3PP']}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={Boolean(percentageErrors.SENDING_DFSP)}>
                  <FormLabel fontSize="sm">{t('ui.sending_dfsp_percent')}</FormLabel>
                  <NumberInput min={0} max={100} precision={2} step={0.01} value={formValues.percentages.SENDING_DFSP} onChange={(value) => updatePercentage('SENDING_DFSP', value)}>
                    <NumberInputField placeholder="e.g. 5.00" />
                  </NumberInput>
                  <FormErrorMessage>{percentageErrors.SENDING_DFSP}</FormErrorMessage>
                </FormControl>
              </Grid>
              <Box
                px={4}
                py={3}
                rounded="md"
                bg={Math.abs(percentageTotal - 100) < 0.001 ? 'green.50' : 'orange.50'}
                color={Math.abs(percentageTotal - 100) < 0.001 ? 'green.700' : 'orange.700'}
                fontSize="sm"
                fontWeight="bold"
              >
                {Math.abs(percentageTotal - 100) < 0.001
                  ? t('ui.revenue_split_total_valid', { total: percentageTotal.toFixed(0) })
                  : t('ui.revenue_split_total_invalid', { total: percentageTotal.toFixed(2) })}
              </Box>

              <RevenueSectionLabel>{t('ui.effective_date_section')}</RevenueSectionLabel>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('ui.effective_date_time')}</FormLabel>
                  <Input type="datetime-local" value={formValues.effectiveDate} onChange={(event) => setFormValues((current) => ({ ...current, effectiveDate: event.target.value }))} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">{t('ui.timezone')}</FormLabel>
                  <CustomSelect
                    options={timezoneOptions}
                    value={selectedTimezoneOption}
                    onChange={(selected: OptionType | null) => {
                      const timezone = timezoneOptions.find((option) => option.value === selected?.value);
                      setFormValues((current) => ({
                        ...current,
                        effectiveTimezone: timezone?.value || 'UTC'
                      }));
                    }}
                    maxMenuHeight={300}
                    menuPlacement="top"
                  />
                </FormControl>
              </Grid>

              <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                {t('ui.revenue_config_effective_date_note')}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModal}>{t('ui.cancel')}</Button>
            <Button
              colorScheme="blue"
              onClick={() => submitApprovalRequest(isEdit ? 'UPDATE_REVENUE_CONFIG' : 'CREATE_REVENUE_CONFIG')}
              isLoading={isSaving}
              isDisabled={!isRevenueConfigFormValid || !isRevenueSplitValid}
            >
              {t('ui.save_rule')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        leastDestructiveRef={cancelDeleteRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.500">
          <AlertDialogContent rounded="xl" boxShadow="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800" pb={2}>
              {t('ui.delete')}
            </AlertDialogHeader>
            <AlertDialogBody color="gray.700" pt={2}>
              <VStack align="stretch" spacing={4}>
                <Text>{t('ui.confirm_delete_revenue_config')}</Text>
                <Box bg="gray.50" border="1px solid" borderColor="gray.100" rounded="lg" px={4} py={3}>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="flex-start" spacing={4}>
                      <Text color="gray.500" fontSize="sm">{t('ui.tax_code')}</Text>
                      <Text color="gray.800" fontSize="sm" fontWeight="semibold" textAlign="right">
                        {deleteTarget?.taxCodeId || '-'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" align="flex-start" spacing={4}>
                      <Text color="gray.500" fontSize="sm">{t('ui.description')}</Text>
                      <Text color="gray.800" fontSize="sm" fontWeight="semibold" textAlign="right">
                        {deleteTarget?.taxCodeDescription || '-'}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter pt={4}>
              <Button ref={cancelDeleteRef} variant="ghost" onClick={closeDeleteDialog} isDisabled={isSaving}>
                {t('ui.cancel')}
              </Button>
              <Button colorScheme="red" onClick={deleteConfig} isLoading={isSaving} ml={3}>
                {t('ui.delete')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </RevenuePageShell>
  );
};

export default RevenueConfig;
