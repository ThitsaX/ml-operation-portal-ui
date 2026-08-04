// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Box,
  Center,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { CellProps, Column, useSortBy, useTable } from 'react-table';
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';
import { ConfirmDialog } from '@components/interface/ConfirmationDialog';
import GlobalFilter from '@components/interface/GlobalFilter';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { useGetPendingRevenueApprovalList } from '@hooks/services/revenue-sharing';
import { modifyRevenueApprovalAction } from '@services/revenue-sharing';
import { IApiErrorResponse, IRevenueApprovalDetail, IRevenuePendingApproval, RevenueApprovalAction, RevenueConfigRequestedActionEnum } from '@typescript/services';
import { PAGE_SIZE_OPTIONS } from '@utils/constants';

interface RevenueSharingApprovalsTabProps {
  isActive: boolean;
  selectedTZString: string;
  onCountChange: (count: number) => void;
}

type RevenueDecisionAction = Exclude<RevenueApprovalAction, 'PENDING'>;

const STATUS_OPTIONS = [
  { value: 'PENDING', labelKey: 'ui.pending' },
  { value: 'APPROVED', labelKey: 'ui.approved' },
  { value: 'REJECTED', labelKey: 'ui.rejected' }
] as const;

const getStatusLabel = (status: RevenueApprovalAction | string, t: (key: string) => string) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.labelKey
    ? t(STATUS_OPTIONS.find((option) => option.value === status)?.labelKey as string)
    : status;

const REVENUE_CONFIG_ACTION_LABELS: Record<RevenueConfigRequestedActionEnum, string> = {
  [RevenueConfigRequestedActionEnum.CREATE]: 'Create Revenue Config',
  [RevenueConfigRequestedActionEnum.UPDATE]: 'Update Revenue Config',
  [RevenueConfigRequestedActionEnum.DELETE]: 'Delete Revenue Config',
  [RevenueConfigRequestedActionEnum.DEACTIVATE]: 'Deactivate Revenue Config'
};

const getNormalizedAction = (action?: string | null) => (action || '').replace(/\s+/g, '_').toUpperCase();

const getRevenueConfigRequestedAction = (action?: string | null) => {
  const normalizedAction = getNormalizedAction(action);

  return Object.values(RevenueConfigRequestedActionEnum).find((requestedAction) =>
    normalizedAction.includes(requestedAction)
  );
};

const formatRequestedAction = (action?: string | null) => {
  const requestedAction = getRevenueConfigRequestedAction(action);
  return requestedAction ? REVENUE_CONFIG_ACTION_LABELS[requestedAction] : action || '-';
};

const isCreateAction = (action?: string | null) =>
  getRevenueConfigRequestedAction(action) === RevenueConfigRequestedActionEnum.CREATE;

const isUpdateAction = (action?: string | null) =>
  getRevenueConfigRequestedAction(action) === RevenueConfigRequestedActionEnum.UPDATE;

const isDeleteAction = (action?: string | null) =>
  [RevenueConfigRequestedActionEnum.DELETE, RevenueConfigRequestedActionEnum.DEACTIVATE].includes(
    getRevenueConfigRequestedAction(action) as RevenueConfigRequestedActionEnum
  );
const getDetail = (details: IRevenueApprovalDetail[] | undefined, key: string) =>
  details?.find((detail) => detail.fieldKey?.toLowerCase() === key.toLowerCase());

const isBlankValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '';

const stringifyDetailValue = (value: string | number | null | undefined) =>
  isBlankValue(value) ? '' : String(value);

const getDetailFieldValue = (details: IRevenueApprovalDetail[] | undefined, key: string) => {
  const detail = getDetail(details, key);
  const value = detail?.fieldValue;
  return isBlankValue(value) ? '-' : String(value);
};

const getDetailDisplayLabel = (detail: IRevenueApprovalDetail) =>
  detail.fieldLabel || detail.fieldKey.replace(/_/g, ' ');

const formatJsonDetailValue = (value: string | number | null | undefined) => {
  if (isBlankValue(value)) return '';
  const stringValue = String(value);

  try {
    const parsed = JSON.parse(stringValue) as Record<string, number | string>;
    if (parsed && typeof parsed === 'object') {
      return [
        ['GoL', parsed.GOL],
        ['Ministry', parsed.MINISTRY],
        ['3PP', parsed['3PP']],
        ['DFSP', parsed.SENDING_DFSP]
      ]
        .filter(([, fieldValue]) => !isBlankValue(fieldValue as string | number | null | undefined))
        .map(([label, fieldValue]) => `${label}: ${fieldValue}%`)
        .join('\n');
    }
  } catch {
    return stringValue;
  }

  return stringValue;
};

const formatDetailValue = (detail: IRevenueApprovalDetail, value: string | number | null | undefined) =>
  detail.valueType === 'JSON' ? formatJsonDetailValue(value) : stringifyDetailValue(value);

const CHANGE_SUMMARY_EXCLUDED_FIELDS = new Set([
  'revenue_config_id',
  'tax_code_id',
  'tax_code_description',
  'effective_date'
]);

const getComparableValue = (detail: IRevenueApprovalDetail, source: 'before' | 'after') => {
  if (source === 'before') return formatDetailValue(detail, detail.beforeValue);
  return formatDetailValue(detail, detail.afterValue ?? detail.fieldValue);
};

const getChangeSummaryDetails = (approval: IRevenuePendingApproval) => {
  const requestedAction = approval.requestedAction;
  const details = [...(approval.details || [])]
    .filter((detail) => !CHANGE_SUMMARY_EXCLUDED_FIELDS.has((detail.fieldKey || '').toLowerCase()))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (isDeleteAction(requestedAction)) {
    const statusDetail = details.find((detail) => (detail.fieldKey || '').toLowerCase() === 'status');
    return statusDetail
      ? [statusDetail]
      : [{
        fieldKey: 'status',
        fieldLabel: 'Status',
        fieldValue: null,
        beforeValue: null,
        afterValue: 'Inactive',
        valueType: 'TEXT',
        displayOrder: 999
      } as IRevenueApprovalDetail];
  }

  if (isUpdateAction(requestedAction)) {
    return details.filter((detail) => getComparableValue(detail, 'before') !== getComparableValue(detail, 'after'));
  }

  return details;
};

const renderChangeSummary = (approval: IRevenuePendingApproval, source: 'before' | 'after') => {
  const details = getChangeSummaryDetails(approval);
  const shouldShowBefore = !isCreateAction(approval.requestedAction);

  if (source === 'before' && !shouldShowBefore) return <Text color="gray.400">-</Text>;
  if (details.length === 0) return <Text color="gray.400">-</Text>;

  return (
    <VStack align="stretch" spacing={1} minW="220px">
      {details.map((detail) => {
        const value = getComparableValue(detail, source);
        if (!value) return null;
        const isPercentagesDetail = detail.valueType === 'JSON' &&
          (detail.fieldKey || '').toLowerCase() === 'percentages';

        return (
          <Box key={detail.fieldKey}>
            {isPercentagesDetail ? (
              <Text color="gray.800" fontSize="sm" fontWeight="normal" whiteSpace="pre-line">{value}</Text>
            ) : (
              <Text color="gray.800" fontSize="sm" fontWeight="normal">
                {getDetailDisplayLabel(detail)}: {value}
              </Text>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};

const RevenueSharingApprovalsTab = ({ isActive, selectedTZString, onCountChange }: RevenueSharingApprovalsTabProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const confirmActionLockedRef = useRef(false);
  const [filterStatus, setFilterStatus] = useState<RevenueApprovalAction>('PENDING');
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<IRevenuePendingApproval | null>(null);
  const [actionType, setActionType] = useState<RevenueDecisionAction | null>(null);
  const [reason, setReason] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const isRejectReasonEmpty = actionType === 'REJECTED' && !reason.trim();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useGetPendingRevenueApprovalList({ enabled: isActive });

  const approvals = useMemo(() => data ?? [], [data]);
  const isTableLoading = isLoading || isFetching;

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    if (isError) {
      toast({
        title: t('ui.failed_to_fetch_pending_revenue_approvals'),
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || t('ui.something_went_wrong'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [error, isError, t, toast]);

  const filteredApprovals = useMemo(() => {
    const normalizedStatus = filterStatus.toUpperCase();
    const searchValue = (search || '').trim().toLowerCase();

    return approvals.filter((approval) => {
      const statusMatches = (approval.action || '').toUpperCase() === normalizedStatus;
      if (!statusMatches) return false;
      if (!searchValue) return true;

      const details = approval.details || [];
      const searchableDetails = details.flatMap((detail) => [
        detail.fieldLabel,
        detail.fieldKey,
        detail.fieldValue,
        detail.beforeValue,
        detail.afterValue
      ]);

      return [
        approval.approvalRequestId,
        approval.requestedAction,
        approval.requestedBy,
        approval.requestCategory,
        approval.action,
        ...searchableDetails
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    });
  }, [approvals, filterStatus, search]);

  const totalRecords = filteredApprovals.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const canPreviousPage = pageNumber > 1;
  const canNextPage = pageNumber < totalPages;

  useEffect(() => {
    onCountChange(totalRecords);
  }, [onCountChange, totalRecords]);

  useEffect(() => {
    setPageNumber(1);
    setPageInput('1');
  }, [filterStatus, pageSize, search]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const goToPage = (nextPage: number) => {
    setPageNumber(Math.min(Math.max(nextPage, 1), totalPages));
  };

  const handlePageInput = (value: string) => {
    if (value.startsWith('0')) {
      setPageInput('');
      return;
    }

    setPageInput(value);
  };

  const formatDate = useCallback((value?: number | string | null) =>
    value ? formatEpochToTZ(value, selectedTZString, 'YYYY-MM-DDTHH:mm:ssZ') : '-', [selectedTZString]);

  const openConfirmDialog = (row: IRevenuePendingApproval, type: RevenueDecisionAction) => {
    setSelectedRow(row);
    setActionType(type);
    setReason('');
    setIsDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsDialogOpen(false);
    setSelectedRow(null);
    setActionType(null);
    setReason('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRow || !actionType || confirmActionLockedRef.current) return;

    const trimmedReason = reason.trim();
    if (actionType === 'REJECTED' && !trimmedReason) {
      toast({
        title: t('ui.reason_required'),
        position: 'top',
        status: 'warning',
        duration: 2500,
        isClosable: true
      });
      return;
    }

    confirmActionLockedRef.current = true;
    setIsActionSubmitting(true);
    try {
      await modifyRevenueApprovalAction({
        approvalRequestId: selectedRow.approvalRequestId,
        action: actionType,
        reason: trimmedReason
      });
      toast({
        title: actionType,
        position: 'top',
        description: `${selectedRow.requestedBy}'s revenue sharing request ${actionType.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      refetch();
      closeConfirmDialog();
    } catch (error) {
      toast({
        title: t('ui.error'),
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || `Failed to ${actionType.toLowerCase()} request.`,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsActionSubmitting(false);
      confirmActionLockedRef.current = false;
    }
  };

  const showActionColumn = filterStatus === 'PENDING' && hasActionPermission('ModifyRevenueApprovalAction');
  const tableColumnCount = showActionColumn ? 8 : 7;
  const emptyMessage = `No ${getStatusLabel(filterStatus, t).toLowerCase()} revenue sharing approvals found.`;

  const columns = useMemo(() => {
    const baseColumns: Column<IRevenuePendingApproval>[] = [
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">{t('ui.requested_action')}</Text>,
        accessor: 'requestedAction',
        Cell: ({ value }: CellProps<IRevenuePendingApproval, string>) => formatRequestedAction(value)
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">Tax Code ID</Text>,
        id: 'taxCodeId',
        accessor: (approval) => getDetailFieldValue(approval.details, 'tax_code_id')
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">Tax Code (Description)</Text>,
        id: 'taxCodeDescription',
        accessor: (approval) => getDetailFieldValue(approval.details, 'tax_code_description')
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">Before</Text>,
        id: 'changeBefore',
        disableSortBy: true,
        Cell: ({ row }: CellProps<IRevenuePendingApproval>) => renderChangeSummary(row.original, 'before')
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">After</Text>,
        id: 'changeAfter',
        disableSortBy: true,
        Cell: ({ row }: CellProps<IRevenuePendingApproval>) => renderChangeSummary(row.original, 'after')
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">Submitted By</Text>,
        accessor: 'requestedBy'
      },
      {
        Header: () => <Text fontWeight="semibold" fontSize="sm">Submitted At</Text>,
        accessor: 'requestedDateTime',
        Cell: ({ value }: any) => formatEpochToTZ(value, selectedTZString, 'YYYY-MM-DDTHH:mm:ssZ')
      }
    ];

    const actionColumn: Column<IRevenuePendingApproval>[] = showActionColumn
      ? [
        {
          Header: () => <Text fontWeight="semibold" fontSize="sm">{t('ui.action')}</Text>,
          id: 'actionButtons',
          disableSortBy: true,
          Cell: ({ row }: CellProps<IRevenuePendingApproval>) => (
            <HStack spacing={4}>
              <Box as="span" color="green.500" cursor="pointer" _hover={{ color: 'green.700' }} onClick={() => openConfirmDialog(row.original, 'APPROVED')}>
                <FiCheckCircle size="18px" />
              </Box>
              <Box as="span" color="red.500" cursor="pointer" _hover={{ color: 'red.700' }} onClick={() => openConfirmDialog(row.original, 'REJECTED')}>
                <FiXCircle size="18px" />
              </Box>
            </HStack>
          )
        }
      ]
      : [];

    return [...baseColumns, ...actionColumn];
  }, [formatDate, showActionColumn, t]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: filteredApprovals
    },
    useSortBy
  );

  const visibleRows = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  const tableHeaders = headerGroups[0]?.headers || [];
  const getHeaderColumn = (columnId: string) => tableHeaders.find((column: any) => column.id === columnId);

  const renderSortIndicator = (column: any) => column.disableSortBy ? null : (
    <VStack display="inline-flex" align="center" spacing={0}>
      <Icon as={IoChevronUp} color={!column.isSorted ? 'gray.400' : !column.isSortedDesc ? 'gray.700' : 'gray.400'} />
      <Icon as={IoChevronDown} color={!column.isSorted ? 'gray.400' : column.isSortedDesc ? 'gray.700' : 'gray.400'} />
    </VStack>
  );

  const renderHeaderCell = (columnId: string, label: string, rowSpan = 1) => {
    const column = getHeaderColumn(columnId);
    if (!column) return null;

    const headerProps = column.getHeaderProps(column.disableSortBy ? undefined : column.getSortByToggleProps());
    const { key, ...headerRest } = headerProps;

    return (
      <Th
        key={key}
        rowSpan={rowSpan}
        px={3}
        py={3}
        textAlign="center"
        verticalAlign="middle"
        textTransform="none"
        border="1px solid"
        borderColor="gray.200"
        bg="gray.100"
        cursor={column.disableSortBy ? 'default' : 'pointer'}
        {...headerRest}
      >
        <HStack align="center" spacing="2" flex={1}>
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{label}</Text>
          {renderSortIndicator(column)}
        </HStack>
      </Th>
    );
  };

  return (
    <>
      <HStack w="full" justifyContent="space-between">
        <CustomSelect
          width="200px"
          options={STATUS_OPTIONS.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
          value={{ value: filterStatus, label: getStatusLabel(filterStatus, t) }}
          onChange={(selectedOption: OptionType | null) => setFilterStatus((selectedOption?.value || 'PENDING') as RevenueApprovalAction)}
        />
      </HStack>

      <VStack w="full" align="flex-start" spacing={2}>
        <GlobalFilter mt={5} globalFilter={search} setGlobalFilter={setSearch} />

        <Box w="full">
          <TableContainer w="full" borderWidth={1} borderColor="gray.200" rounded="lg" mt="4" overflowX="auto">
            <Table variant="simple" minW="900px" {...getTableProps()}>
              <Thead bg="gray.100">
                <Tr>
                  {renderHeaderCell('requestedAction', t('ui.requested_action'), 2)}
                  {renderHeaderCell('taxCodeId', 'Tax Code ID', 2)}
                  {renderHeaderCell('taxCodeDescription', 'Tax Code (Description)', 2)}
                  <Th
                    colSpan={2}
                    px={3}
                    py={3}
                    textAlign="center"
                    verticalAlign="middle"
                    textTransform="none"
                    border="1px solid"
                    borderColor="gray.200"
                    bg="gray.100"
                  >
                    <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Change Summary</Text>
                  </Th>
                  {renderHeaderCell('requestedBy', 'Submitted By', 2)}
                  {renderHeaderCell('requestedDateTime', 'Submitted At', 2)}
                  {showActionColumn ? renderHeaderCell('actionButtons', 'Actions', 2) : null}
                </Tr>
                <Tr>
                  {renderHeaderCell('changeBefore', 'Before')}
                  {renderHeaderCell('changeAfter', 'After')}
                </Tr>
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {isTableLoading ? (
                  <Tr>
                    <Td colSpan={tableColumnCount} py={12}>
                      <Center>
                        <VStack spacing={3}>
                          <Spinner color="blue.500" />
                          <Text fontSize="sm" color="gray.600">{t('ui.loading_revenue_approvals')}</Text>
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                ) : visibleRows.length === 0 ? (
                  <Tr>
                    <Td colSpan={tableColumnCount} py={10} textAlign="center" color="gray.600">
                      {emptyMessage}
                    </Td>
                  </Tr>
                ) : (
                  visibleRows.map((row) => {
                    prepareRow(row);
                    const rowProps = row.getRowProps();
                    const { key: rowKey, ...rowRest } = rowProps;

                    return (
                      <Tr key={rowKey} fontSize="sm" cursor="pointer" _hover={{ bg: 'muted.50' }} {...rowRest}>
                        {row.cells.map((cell) => {
                          const cellProps = cell.getCellProps();
                          const { key: cellKey, ...cellRest } = cellProps;

                          return <Td key={cellKey} {...cellRest} py={3} px={3} border="1px solid" borderColor="gray.200" verticalAlign="top">{cell.render('Cell')}</Td>;
                        })}
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </TableContainer>
          <HStack spacing={2} justify="space-between" w="full" px={4} py={3} bg="gray.50" borderTopWidth="1px">
            <HStack flex={2}>
              <IconButton aria-label={t('ui.skip_to_start')} variant="ghost" icon={<TfiAngleDoubleLeft />} isDisabled={!canPreviousPage || isTableLoading} onClick={() => goToPage(1)} />
              <IconButton aria-label={t('ui.go_previous')} variant="ghost" icon={<TfiAngleLeft />} isDisabled={!canPreviousPage || isTableLoading} onClick={() => goToPage(pageNumber - 1)} />
              <IconButton aria-label={t('ui.go_next')} variant="ghost" icon={<TfiAngleRight />} isDisabled={!canNextPage || isTableLoading} onClick={() => goToPage(pageNumber + 1)} />
              <IconButton aria-label={t('ui.skip_to_end')} variant="ghost" icon={<TfiAngleDoubleRight />} isDisabled={!canNextPage || isTableLoading} onClick={() => goToPage(totalPages)} />
            </HStack>
            <Text>{t('ui.page')}{' '}<strong>{pageNumber} {t('ui.of')} {totalPages}</strong></Text>
            <Box h="6"><Divider orientation="vertical" /></Box>
            <HStack spacing={2} minW="120px" flexShrink={0}>
              <Text whiteSpace="nowrap">{t('ui.rows')}</Text>
              <CustomSelect
                options={PAGE_SIZE_OPTIONS}
                value={PAGE_SIZE_OPTIONS.find((option) => option.value === String(pageSize)) || null}
                onChange={(selectedOption) => {
                  if (!selectedOption) return;
                  setPageSize(Number(selectedOption.value));
                  setPageNumber(1);
                }}
                maxMenuHeight={150}
                menuPortalTarget={true}
                menuPlacement="top"
              />
            </HStack>
            <HStack>
              <Text>{t('ui.go_to_page')}</Text>
              <Input
                value={pageInput ? Number(pageInput) : ''}
                textAlign="center"
                w="14"
                type="number"
                min={1}
                max={totalPages}
                isDisabled={isTableLoading}
                onChange={(event) => handlePageInput(event.target.value)}
                onBlur={() => setPageInput(String(pageNumber))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    let nextPage = Number(pageInput);
                    if (!nextPage || nextPage < 1) nextPage = 1;
                    if (nextPage > totalPages) nextPage = totalPages;
                    setPageInput(String(nextPage));
                    goToPage(nextPage);
                  }
                }}
              />
            </HStack>
          </HStack>
        </Box>
      </VStack>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title={actionType === 'APPROVED' ? t('ui.approve_request') : t('ui.reject_request')}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        confirmText={actionType === 'APPROVED' ? t('ui.approve') : t('ui.reject')}
        cancelText={t('ui.cancel')}
        isLoading={isActionSubmitting}
        isConfirmDisabled={isRejectReasonEmpty}
      >
        <VStack align="stretch" spacing={4}>
          <Text>
            {selectedRow ? `${t('ui.are_you_sure_you_want_to')} ${actionType?.toLowerCase()} the revenue sharing request from ${selectedRow.requestedBy}?` : ''}
          </Text>
          {actionType === 'REJECTED' && (
            <FormControl isRequired>
              <FormLabel fontSize="sm">{t('ui.reason')}</FormLabel>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t('ui.enter_reason')}
                resize="vertical"
                minH="96px"
              />
            </FormControl>
          )}
        </VStack>
      </ConfirmDialog>
    </>
  );
};

export default RevenueSharingApprovalsTab;
