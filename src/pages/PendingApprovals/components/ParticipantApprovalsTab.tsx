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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { Column, useGlobalFilter, usePagination, useSortBy, useTable } from 'react-table';
import { ConfirmDialog } from '@components/interface/ConfirmationDialog';
import GlobalFilter from '@components/interface/GlobalFilter';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { useGetPendingApprovalList } from '@hooks/services';
import { modifyApprovalAction } from '@services/pending-approvals';
import { IApiErrorResponse } from '@typescript/services';
import { IPendingApproval, PendingApprovalStatus } from '@typescript/services/pending-approvals';
import { formatNumberWithCommas } from '@utils';

interface ParticipantApprovalsTabProps {
  selectedTZString: string;
  filterStatus: PendingApprovalStatus;
  onCountChange: (count: number) => void;
}

const ParticipantApprovalsTab = ({ selectedTZString, filterStatus, onCountChange }: ParticipantApprovalsTabProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [pageNumber, setPageNumber] = useState<String>('1');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<IPendingApproval | null>(null);
  const [actionType, setActionType] = useState<PendingApprovalStatus | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const confirmActionLockedRef = useRef(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetPendingApprovalList();

  const filteredRequests = useMemo(
    () => data?.filter((request) => (request.action ?? '').toUpperCase() === filterStatus) ?? [],
    [data, filterStatus]
  );
  const isTableLoading = isLoading || isFetching;

  useEffect(() => {
    onCountChange(filteredRequests.length);
  }, [filteredRequests.length, onCountChange]);

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

  const openConfirmDialog = (row: IPendingApproval, type: PendingApprovalStatus) => {
    setSelectedRow(row);
    setActionType(type);
    setIsDialogOpen(true);
  };

  const closeConfirmDialog = () => {
    setIsDialogOpen(false);
    setSelectedRow(null);
    setActionType(null);
  };

  const handleAction = async (row: IPendingApproval, type: PendingApprovalStatus) => {
    try {
      await modifyApprovalAction(row.approvalRequestId, type);
      toast({
        title: `${type}`,
        position: 'top',
        description: `${row.requestedBy}'s ${t('ui.request').toLowerCase()} ${type.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      refetch();
    } catch (error) {
      toast({
        title: t('ui.error'),
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || `Failed to ${type.toLowerCase()} request.`,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedRow || !actionType || confirmActionLockedRef.current) return;
    confirmActionLockedRef.current = true;
    setIsActionSubmitting(true);
    try {
      await handleAction(selectedRow, actionType);
      closeConfirmDialog();
    } finally {
      setIsActionSubmitting(false);
      confirmActionLockedRef.current = false;
    }
  };

  const columns = useMemo(() => {
    const baseColumns: Column<IPendingApproval>[] = [
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.requested_action')}</Text>,
        accessor: 'requestedAction'
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm">{t('ui.dfsp')}</Text>,
        accessor: 'participantName'
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.currency')}</Text>,
        accessor: 'currency',
        Cell: ({ value }) => <Text textAlign="center">{value}</Text>
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.amount_percentage')}</Text>,
        accessor: 'amount',
        Cell: ({ value }: any) => <Box textAlign="right">{formatNumberWithCommas(value)}</Box>
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.requested_by')}</Text>,
        accessor: 'requestedBy'
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.requested_date_time')}</Text>,
        accessor: 'requestedDateTime',
        Cell: ({ value }: any) => formatEpochToTZ(value, selectedTZString, 'YYYY-MM-DDTHH:mm:ssZ')
      },
      {
        Header: () => <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.status')}</Text>,
        accessor: 'action'
      }
    ];

    const statusColumn: Column<IPendingApproval>[] =
      filterStatus === PendingApprovalStatus.PENDING && hasActionPermission('ModifyApprovalAction')
        ? [
          {
            Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="none">{t('ui.action')}</Text>,
            id: 'id',
            disableSortBy: true,
            Cell: ({ row }: any) => (
              <HStack spacing={4}>
                <Box as="span" color="green.500" cursor="pointer" _hover={{ color: 'green.700' }} onClick={() => openConfirmDialog(row.original, PendingApprovalStatus.APPROVED)}>
                  <FiCheckCircle size="18px" />
                </Box>
                <Box as="span" color="red.500" cursor="pointer" _hover={{ color: 'red.700' }} onClick={() => openConfirmDialog(row.original, PendingApprovalStatus.REJECTED)}>
                  <FiXCircle size="18px" />
                </Box>
              </HStack>
            )
          }
        ]
        : [];

    return [...baseColumns, ...statusColumn];
  }, [filterStatus, selectedTZString, t]);

  const tableColumnCount = columns.length;
  const emptyMessage = `No ${filterStatus.toLowerCase()} participant approvals found.`;

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex, globalFilter },
    setGlobalFilter
  } = useTable(
    {
      columns,
      data: filteredRequests,
      initialState: {
        pageIndex: 0,
        pageSize: 10
      }
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  useEffect(() => {
    setPageNumber(String(pageIndex + 1));
  }, [pageIndex]);

  const handlePageValidation = (value: string) => {
    if (Number(value) > pageOptions.length) {
      setPageNumber(pageNumber);
    } else if (value.startsWith('0')) {
      setPageNumber('');
    } else {
      setPageNumber(value);
    }
  };

  return (
    <>
      <VStack w="full" align="flex-start" spacing={2}>
        <GlobalFilter mt={5} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

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
                        const headerProps = column.getHeaderProps(column.disableSortBy ? undefined : column.getSortByToggleProps());
                        const { key: headerKey, ...headerRest } = headerProps;
                        return (
                          <Th key={headerKey} px={3} {...headerRest}>
                            <HStack align="center" spacing="2" flex={1}>
                              {column.render('Header')}
                              {column.disableSortBy ? null : (
                                <VStack display="inline-flex" align="center" spacing={0}>
                                  <Icon as={IoChevronUp} size={12} color={!column.isSorted ? 'gray.400' : !column.isSortedDesc ? 'gray.700' : 'gray.400'} />
                                  <Icon as={IoChevronDown} size={12} color={!column.isSorted ? 'gray.400' : column.isSortedDesc ? 'gray.700' : 'gray.400'} />
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
              <Tbody maxH={300} overflowY="auto" {...getTableBodyProps()}>
                {isTableLoading ? (
                  <Tr>
                    <Td colSpan={tableColumnCount} py={12}>
                      <Center>
                        <VStack spacing={3}>
                          <Spinner color="blue.500" />
                          <Text fontSize="sm" color="gray.600">Loading participant approvals...</Text>
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                ) : page.length === 0 ? (
                  <Tr>
                    <Td colSpan={tableColumnCount} py={10} textAlign="center" color="gray.600">
                      {emptyMessage}
                    </Td>
                  </Tr>
                ) : (
                  page.map((row) => {
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
              <IconButton aria-label={t('ui.skip_to_start')} variant="ghost" icon={<TfiAngleDoubleLeft />} isDisabled={!canPreviousPage || isTableLoading} onClick={() => gotoPage(0)} />
              <IconButton aria-label={t('ui.go_previous')} variant="ghost" icon={<TfiAngleLeft />} isDisabled={!canPreviousPage || isTableLoading} onClick={previousPage} />
              <IconButton aria-label={t('ui.go_next')} variant="ghost" icon={<TfiAngleRight />} isDisabled={!canNextPage || isTableLoading} onClick={nextPage} />
              <IconButton aria-label={t('ui.skip_to_end')} variant="ghost" icon={<TfiAngleDoubleRight />} isDisabled={!canNextPage || isTableLoading} onClick={() => gotoPage(pageCount - 1)} />
            </HStack>
            <Text>{t('ui.page')}{' '}<strong>{pageIndex + 1} {t('ui.of')} {pageOptions.length || 1}</strong></Text>
            <Box h="6"><Divider orientation="vertical" /></Box>
            <HStack>
              <Text>{t('ui.go_to_page')}</Text>
              <Input
                value={pageNumber ? Number(pageNumber) : ''}
                textAlign="center"
                w="14"
                type="number"
                min={pageIndex + 1}
                max={pageOptions.length}
                isDisabled={isTableLoading}
                onChange={(e) => {
                  handlePageValidation(e.target.value);
                  const nextPageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(nextPageNumber);
                }}
              />
            </HStack>
          </HStack>
        </Box>
      </VStack>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title={actionType === PendingApprovalStatus.APPROVED ? t('ui.approve_request') : t('ui.reject_request')}
        message={selectedRow ? `${t('ui.are_you_sure_you_want_to')} ${actionType?.toLowerCase()} ${t('ui.the_request_from')} ${selectedRow.requestedBy}?` : ''}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        confirmText={actionType === PendingApprovalStatus.APPROVED ? t('ui.approve') : t('ui.reject')}
        cancelText={t('ui.cancel')}
        isLoading={isActionSubmitting}
      />
    </>
  );
};

export default ParticipantApprovalsTab;