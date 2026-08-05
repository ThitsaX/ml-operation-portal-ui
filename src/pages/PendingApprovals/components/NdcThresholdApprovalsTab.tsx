// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Box,
  Center,
  Divider,
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
import { Column, useSortBy, useTable } from 'react-table';
import { CustomSelect } from '@components/interface';
import { ConfirmDialog } from '@components/interface/ConfirmationDialog';
import GlobalFilter from '@components/interface/GlobalFilter';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { useGetNdcThresholdApprovals } from '@hooks/services/ndc-configurations';
import { modifyNdcThresholdApprovalDecision } from '@services/ndc-configurations';
import { IApiErrorResponse, INdcThresholdApproval, NdcThresholdApprovalStatus } from '@typescript/services';
import { PAGE_SIZE_OPTIONS } from '@utils/constants';

interface NdcThresholdApprovalsTabProps {
  isActive: boolean;
  selectedTZString: string;
  filterStatus: NdcThresholdApprovalStatus;
  onCountChange: (count: number) => void;
}


const formatNdcOperation = (operation: string) =>
  operation
    .replace(/^NDC_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatThresholdValue = (value: number | null) =>
  value === null || value === undefined ? '-' : `${value}%`;

const NdcThresholdApprovalsTab = ({ isActive, selectedTZString, filterStatus, onCountChange }: NdcThresholdApprovalsTabProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<INdcThresholdApproval | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const confirmActionLockedRef = useRef(false);

  const queryParams = useMemo(
    () => ({
      status: filterStatus,
      page: pageNumber,
      pageSize
    }),
    [filterStatus, pageNumber, pageSize]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useGetNdcThresholdApprovals(queryParams, {
    enabled: isActive
  });

  const approvals = useMemo(() => data?.approvals ?? [], [data?.approvals]);
  const hasServerPagination = data?.total !== undefined || data?.totalPages !== undefined;
  const isTableLoading = isLoading || isFetching;

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);


  useEffect(() => {
    if (isError) {
      toast({
        title: t('ui.failed_to_fetch_pending_approvals'),
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || t('ui.something_went_wrong'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [error, isError, t, toast]);

  const filteredApprovals = useMemo(() => {
    const searchValue = (search || '').trim().toLowerCase();
    if (!searchValue) return approvals;

    return approvals.filter((approval) =>
      [
        approval.operation,
        approval.participantName,
        approval.currency,
        approval.requestedBy,
        approval.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue))
    );
  }, [approvals, search]);

  const totalRecords = hasServerPagination ? data?.total ?? approvals.length : filteredApprovals.length;
  const totalPages = Math.max(1, data?.totalPages ?? Math.ceil(totalRecords / pageSize));
  const canPreviousPage = pageNumber > 1;
  const canNextPage = pageNumber < totalPages;

  useEffect(() => {
    onCountChange(totalRecords);
  }, [onCountChange, totalRecords]);

  useEffect(() => {
    setPageNumber(1);
    setPageInput('1');
  }, [filterStatus, pageSize]);

  useEffect(() => {
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
    }
  }, [pageNumber, totalPages]);

  const goToPage = (nextPage: number) => {
    const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages);
    setPageNumber(normalizedPage);
  };

  const handlePageInput = (value: string) => {
    if (value.startsWith('0')) {
      setPageInput('');
      return;
    }

    setPageInput(value);
  };

  const formatDate = useCallback((value?: string | null) =>
    value ? formatEpochToTZ(value, selectedTZString, 'YYYY-MM-DDTHH:mm:ssZ') : '-', [selectedTZString]);

  const openConfirmDialog = (row: INdcThresholdApproval, type: 'APPROVED' | 'REJECTED') => {
    setSelectedRow(row);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsDialogOpen(false);
    setSelectedRow(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedRow || !actionType || confirmActionLockedRef.current) return;
    confirmActionLockedRef.current = true;
    setIsActionSubmitting(true);
    try {
      await modifyNdcThresholdApprovalDecision(selectedRow.approvalRequestId, { action: actionType });
      toast({
        title: actionType,
        position: 'top',
        description: `${selectedRow.requestedBy}'s NDC threshold request ${actionType.toLowerCase()}.`,
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

  const showActionColumn = filterStatus === 'PENDING' && hasActionPermission('ModifyNdcThresholdApprovalAction');
  const tableColumnCount = showActionColumn ? 9 : 8;
  const emptyMessage = `No ${filterStatus.toLowerCase()} NDC threshold approvals found.`;

  const columns = useMemo(() => {
    const baseColumns: Column<INdcThresholdApproval>[] = [
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Requested Action</Text>,
        accessor: 'operation',
        Cell: ({ value }: any) => formatNdcOperation(value)
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm">DFSP</Text>,
        accessor: 'participantName'
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Currency</Text>,
        accessor: 'currency',
        Cell: ({ value }: any) => <Text textAlign="center">{value}</Text>
      },
      {
        Header: () => <Text flex={1} textAlign="right" fontWeight="semibold" fontSize="sm" textTransform="capitalize">Visual Alert</Text>,
        accessor: 'requestedVisualConfig',
        Cell: ({ value }: any) => <Box textAlign="right">{formatThresholdValue(value)}</Box>
      },
      {
        Header: () => <Text flex={1} textAlign="right" fontWeight="semibold" fontSize="sm" textTransform="capitalize">Notification Alert</Text>,
        accessor: 'requestedNotificationConfig',
        Cell: ({ value }: any) => <Box textAlign="right">{formatThresholdValue(value)}</Box>
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Submitted By</Text>,
        accessor: 'requestedBy'
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Submitted At</Text>,
        accessor: 'requestedAt',
        Cell: ({ value }: any) => formatDate(value)
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Status</Text>,
        accessor: 'status'
      }
    ];

    const actionColumn: Column<INdcThresholdApproval>[] = showActionColumn
      ? [
        {
          Header: () => <Text fontWeight="semibold" fontSize="sm">Action</Text>,
          id: 'action',
          disableSortBy: true,
          Cell: ({ row }: any) => (
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
  }, [formatDate, showActionColumn]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: filteredApprovals,
      manualPagination: true,
      pageCount: totalPages
    },
    useSortBy
  );

  const visibleRows = hasServerPagination
    ? rows
    : rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

  return (
    <>

      <VStack w="full" align="flex-start" spacing={2}>
        <GlobalFilter mt={5} globalFilter={search} setGlobalFilter={setSearch} />

        <Box w="full">
          <TableContainer w="full" borderWidth={1} borderColor="gray.100" rounded="lg">
            <Table variant="simple" {...getTableProps()}>
              <Thead bg="gray.100">
                {headerGroups.map((headerGroup) => {
                  const headerGroupProps = headerGroup.getHeaderGroupProps();
                  const { key: headerGroupKey, ...headerGroupRest } = headerGroupProps;

                  return (
                    <Tr key={headerGroupKey} {...headerGroupRest}>
                      {headerGroup.headers.map((column) => {
                        const headerProps = column.getHeaderProps(
                          column.disableSortBy ? undefined : column.getSortByToggleProps()
                        );
                        const { key: headerKey, ...headerRest } = headerProps;

                        return (
                          <Th key={headerKey} px={3} {...headerRest}>
                            <HStack align="center" spacing="2" flex={1}>
                              {column.render('Header')}
                              {column.disableSortBy ? null : (
                                <VStack display="inline-flex" align="center" spacing={0}>
                                  <Icon
                                    as={IoChevronUp}
                                    size={12}
                                    color={!column.isSorted ? 'gray.400' : !column.isSortedDesc ? 'gray.700' : 'gray.400'}
                                  />
                                  <Icon
                                    as={IoChevronDown}
                                    size={12}
                                    color={!column.isSorted ? 'gray.400' : column.isSortedDesc ? 'gray.700' : 'gray.400'}
                                  />
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
                    <Td colSpan={tableColumnCount} py={12}>
                      <Center>
                        <VStack spacing={3}>
                          <Spinner color="blue.500" />
                          <Text fontSize="sm" color="gray.600">Loading NDC threshold approvals...</Text>
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

                          return <Td key={cellKey} {...cellRest} py={2}>{cell.render('Cell')}</Td>;
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
        message={selectedRow ? `${t('ui.are_you_sure_you_want_to')} ${actionType?.toLowerCase()} the NDC threshold request from ${selectedRow.requestedBy}?` : ''}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        confirmText={actionType === 'APPROVED' ? t('ui.approve') : t('ui.reject')}
        cancelText={t('ui.cancel')}
        isLoading={isActionSubmitting}
      />
    </>
  );
};

export default NdcThresholdApprovalsTab;

