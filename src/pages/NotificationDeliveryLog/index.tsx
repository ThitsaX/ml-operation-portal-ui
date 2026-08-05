// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Heading,
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
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { ITimezoneOption } from 'react-timezone-select';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { Column, useSortBy, useTable } from 'react-table';
import { CustomSelect } from '@components/interface';
import { getErrorMessage } from '@helpers/errors';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { useGetDeliveryLogs } from '@hooks/services/ndc-configurations';
import { RootState } from '@store';
import type { IApiErrorResponse, INdcDeliveryLog, NdcDeliveryStatus } from '@typescript/services';
import { useTranslation } from 'react-i18next';
import { PAGE_SIZE_OPTIONS } from '@utils/constants';

type StatusFilter = NdcDeliveryStatus | 'ALL';

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Retrying', value: 'RETRYING' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'SENT':
      return { bg: 'green.50', color: 'green.700' };
    case 'FAILED':
      return { bg: 'red.50', color: 'red.700' };
    case 'RETRYING':
      return { bg: 'orange.50', color: 'orange.700' };
    case 'PENDING':
      return { bg: 'yellow.50', color: 'yellow.700' };
    default:
      return { bg: 'gray.100', color: 'gray.700' };
  }
};

const formatDeliveryLogId = (value?: INdcDeliveryLog['ndcNotificationDispatchLogId']) =>
  value ? String(value) : '-';

const NotificationDeliveryLog = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>((s) => s.app.selectedTimezone);
  const selectedTZString = selectedTimezone.value;

  const [deliveryStatus, setDeliveryStatus] = useState<StatusFilter>('ALL');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [pageSize, setPageSize] = useState(10);

  const queryParams = useMemo(() => ({
    deliveryStatus: deliveryStatus === 'ALL' ? undefined : deliveryStatus,
    page: pageNumber,
    pageSize,
  }), [deliveryStatus, pageNumber, pageSize]);

  const { data, isLoading, isFetching, isError, error } = useGetDeliveryLogs(queryParams);
  const deliveryLogs = useMemo(() => data?.deliveryLogs ?? [], [data?.deliveryLogs]);
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const canPreviousPage = pageNumber > 1;
  const canNextPage = pageNumber < totalPages;

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    if (isError) {
      toast({
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || t('ui.failed_to_fetch_delivery_logs'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [error, isError, t, toast]);

  const changeStatus = (status: StatusFilter) => {
    setDeliveryStatus(status);
    setPageNumber(1);
  };

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

  const formatLastUpdate = useCallback((log: INdcDeliveryLog) => {
    const timestamp = log.updatedAt || log.sentAt || log.lastAttemptAt || log.createdAt;
    return formatEpochToTZ(timestamp, selectedTZString, 'YYYY-MM-DDTHH:mm:ssZ');
  }, [selectedTZString]);

  const columns = useMemo<Column<INdcDeliveryLog>[]>(() => [
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.id')}</Text>,
      id: 'id',
      accessor: (log) => formatDeliveryLogId(log.ndcNotificationDispatchLogId),
      Cell: ({ value }: { value: string }) => <Text whiteSpace="nowrap">{value}</Text>,
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.dfsp')}</Text>,
      accessor: 'participantName',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.currency')}</Text>,
      accessor: 'currency',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.recipient')}</Text>,
      accessor: 'recipientEmail',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.recipient_type')}</Text>,
      accessor: 'recipientType',
      Cell: ({ value }) => value || '-',
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.status')}</Text>,
      accessor: 'deliveryStatus',
      Cell: ({ value }) => {
        const statusStyle = getStatusColor(value);

        return (
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            textTransform="none"
            bg={statusStyle.bg}
            color={statusStyle.color}
            fontSize="xs"
            fontWeight="bold"
          >
            {STATUS_LABELS[value] ?? value}
          </Badge>
        );
      },
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.attempts')}</Text>,
      accessor: 'attemptNo',
      Cell: ({ value }) => value ?? '-',
    },
    {
      Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.last_update')}</Text>,
      id: 'lastUpdate',
      accessor: (log) => formatLastUpdate(log),
      Cell: ({ value }: { value: string }) => <Text whiteSpace="nowrap">{value}</Text>,
    },
  ], [formatLastUpdate, t]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: deliveryLogs,
      autoResetSortBy: false,
    },
    useSortBy
  );

  const isTableLoading = isLoading || isFetching;
  const tableColumnCount = columns.length;

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.notification_delivery_log')}</Heading>

      <Box
        w="full"
        bg="white"
        py={{ base: 4, md: 6 }}
      >
        <VStack align="stretch" spacing={5}>
          <Box>
            <Heading fontSize="lg" fontWeight="bold" mb={1}>{t('ui.delivery_records')}</Heading>
            <Text color="gray.600" fontSize="sm">
              {t('ui.notification_delivery_log_description')}
            </Text>
          </Box>

          <HStack spacing={2} flexWrap="wrap" align="center">
            {STATUS_FILTERS.map((status) => {
              const isSelected = deliveryStatus === status.value;

              return (
                <Button
                  key={status.value}
                  size="sm"
                  variant={isSelected ? 'solid' : 'outline'}
                  bg={isSelected ? 'primary' : 'white'}
                  borderColor={isSelected ? 'primary' : 'gray.300'}
                  color={isSelected ? 'white' : 'gray.700'}
                  fontWeight="500"
                  h="40px"
                  px={4}
                  onClick={() => changeStatus(status.value)}
                  _hover={{
                    bg: isSelected ? 'primary' : 'gray.50',
                    borderColor: isSelected ? 'primary' : 'gray.400',
                  }}
                >
                  {status.label}
                </Button>
              );
            })}
          </HStack>

          <Box w="full">
            <TableContainer
              w="full"
              borderWidth={1}
              borderColor="gray.100"
              rounded="lg"
              mt="4"
            >
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
                          <Th key={headerKey} px={3} textAlign="center" {...headerRest}>
                            <HStack align="center" justify="center" spacing="2" flex={1}>
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
                          <Text fontSize="sm" color="gray.600">{t('ui.loading_delivery_logs')}</Text>
                        </VStack>
                      </Center>
                    </Td>
                  </Tr>
                ) : rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={tableColumnCount} py={10} textAlign="center" color="gray.600">
                      {t('ui.no_delivery_logs_found')}
                    </Td>
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

                          return (
                            <Td key={cellKey} py={2} px={3} textAlign="center" {...cellRest}>
                              {cell.render('Cell')}
                            </Td>
                          );
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
              <IconButton
                aria-label={t('ui.skip_to_start')}
                variant="ghost"
                icon={<TfiAngleDoubleLeft />}
                isDisabled={!canPreviousPage || isFetching}
                onClick={() => goToPage(1)}
              />
              <IconButton
                aria-label={t('ui.go_previous')}
                variant="ghost"
                icon={<TfiAngleLeft />}
                isDisabled={!canPreviousPage || isFetching}
                onClick={() => goToPage(pageNumber - 1)}
              />
              <IconButton
                aria-label={t('ui.go_next')}
                variant="ghost"
                icon={<TfiAngleRight />}
                isDisabled={!canNextPage || isFetching}
                onClick={() => goToPage(pageNumber + 1)}
              />
              <IconButton
                aria-label={t('ui.skip_to_end')}
                variant="ghost"
                icon={<TfiAngleDoubleRight />}
                isDisabled={!canNextPage || isFetching}
                onClick={() => goToPage(totalPages)}
              />
            </HStack>

            <Text>
              {t('ui.page')} <strong>{pageNumber}</strong> {t('ui.of')} <strong>{totalPages}</strong>
            </Text>

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
                isDisabled={isFetching}
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
                size="sm"
              />
            </HStack>
            </HStack>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
};

export default NotificationDeliveryLog;




