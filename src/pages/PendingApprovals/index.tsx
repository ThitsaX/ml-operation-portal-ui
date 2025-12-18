import {
  VStack,
  Heading,
  Text,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  useToast,
  HStack,
  IconButton,
  Input,
  Box,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { useGetPendingApprovalList } from '@hooks/services';
import { IPendingApproval, PendingApprovalStatus } from '@typescript/services/pending-approvals';
import { modifyApprovalAction } from '@services/pending-approvals'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

import { usePagination, useSortBy, useTable, Column ,useGlobalFilter } from 'react-table';
import { ConfirmDialog } from '../../components/interface/ConfirmationDialog';
import { formatEpochToTZ } from '@helpers/dateHelper';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { hasActionPermission } from '@helpers/permissions';
import { IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';
import GlobalFilter from '@components/interface/GlobalFilter';
import { formatNumberWithCommas } from '@utils';

const PendingApprovals = () => {
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filteredRequests, setFilteredRequests] = useState([] as IPendingApproval[]);

  //Selected timezone offset
  const selectedTZString = selectedTimezone.value;

  const toast = useToast();
  const { data, isError, error, refetch } = useGetPendingApprovalList();

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Failed to fetch pending approvals',
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [isError, error, toast]);

  // State
  const [pageNumber, setPageNumber] = useState<String>('1');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<IPendingApproval | null>(null);
  const [actionType, setActionType] = useState<PendingApprovalStatus | null>(null);

  useEffect(() => {
    const filtered = data?.filter(request =>
      filterStatus === 'PENDING ' ? true : request.action === filterStatus
    ) ?? [];
    setFilteredRequests(filtered);
  }, [filterStatus, data])

  // Dialog Controls
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

  //  Action Handlers 
  const handleConfirmAction = () => {
    if (!selectedRow || !actionType) return;
    handleAction(selectedRow);
    closeConfirmDialog();
  };

  const handleAction = (row: IPendingApproval) => {
    if (!actionType) return;
    modifyApprovalAction(row.approvalRequestId, actionType)
      .then(() => {
        toast({
          title: `${actionType}`,
          position: 'top',
          description: `${row.requestedBy}'s request ${actionType?.toLowerCase()}.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        refetch();
      })
      .catch((error: IApiErrorResponse) => {
        toast({
          title: 'Error',
          position: 'top',
          description: getErrorMessage(error) || `Failed to ${actionType?.toLowerCase()} request.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // Table setup
  const columns = useMemo(() => {
    const baseColumns: Column<IPendingApproval>[] = [
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Requested Action</Text>
        ),
        accessor: 'requestedAction'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm">DFSP</Text>
        ),
        accessor: 'participantName'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Currency</Text>
        ),
        accessor: 'currency',
        Cell: ({ value }) => (
          <Text textAlign="center">
            {value}
          </Text>
        ),
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Amount/Percentage</Text>
        ),
        accessor: 'amount',
        Cell: ({ value }: any) => (
          <Box textAlign={'right'}>
            {formatNumberWithCommas(value)}
          </Box>
        )

      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Requested By</Text>
        ),
        accessor: 'requestedBy'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Requested Date Time</Text>
        ),
        accessor: 'requestedDateTime',
        Cell: ({ value }: any) => formatEpochToTZ(value, selectedTZString, "YYYY-MM-DDTHH:mm:ssZ")
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Status</Text>
        ),
        accessor: 'action'
      },
    ] as Column<IPendingApproval>[];;

    const statusColumn: Partial<Column<IPendingApproval>>[] =
      filterStatus === 'PENDING' && hasActionPermission("ModifyApprovalAction")
        ? [
          {
            Header: () => <Text fontWeight="semibold" fontSize="sm" textTransform="none">Action</Text>,
            id: 'id',
            disableSortBy: true,
            Cell: ({ row }: any) => (
              <HStack spacing={4}>
                <Box
                  as="span"
                  color="green.500"
                  cursor="pointer"
                  _hover={{ color: 'green.700' }}
                  onClick={() => openConfirmDialog(row.original, PendingApprovalStatus.APPROVED)}
                >
                  <FiCheckCircle size="18px" />
                </Box>
                <Box
                  as="span"
                  color="red.500"
                  cursor="pointer"
                  _hover={{ color: 'red.700' }}
                  onClick={() => openConfirmDialog(row.original, PendingApprovalStatus.REJECTED)}
                >
                  <FiXCircle size="18px" />
                </Box>
              </HStack>
            ),
          },
        ]
        : [];

    return [...baseColumns, ...statusColumn];
  }, [filterStatus, selectedTZString]) as Column<IPendingApproval>[];;


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
    state: { pageIndex ,globalFilter},
    setGlobalFilter,
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
      setPageNumber(pageNumber)
    } else if (value.startsWith('0')) {
      setPageNumber('')
    } else {
      setPageNumber(value)
    }
  }


  return (

    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>Pending Approvals</Heading>

      <HStack w="full" justifyContent="space-between">
        <CustomSelect
          width="200px"
          options={[
            { value: 'PENDING', label: 'PENDING' },
            { value: 'APPROVED', label: 'APPROVED' },
            { value: 'REJECTED', label: 'REJECTED' },
          ]}
          value={{ value: filterStatus, label: filterStatus }}
          onChange={(selectedOption: OptionType | null) => setFilterStatus(selectedOption?.value || 'PENDING')}
        />

      </HStack>

      <VStack w="full" align="flex-start" spacing={2} >
        <GlobalFilter mt={5} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />


        <Box w="full">
          <TableContainer
            w="full"
            borderWidth={1}
            borderColor="gray.100"
            rounded="lg"
            mt="4">
            <Table variant="simple" {...getTableProps()}>
              <Thead bg="gray.100">
                {headerGroups.map((headerGroup) => (
                  <Tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <Th
                        {...column.getHeaderProps(
                          column.disableSortBy
                            ? undefined
                            : column.getSortByToggleProps()
                        )}>
                        <HStack align="center" spacing="2" flex={1}>
                          {column.render('Header')}
                          {column.disableSortBy ? null : (
                            <VStack
                              display="inline-flex"
                              align="center"
                              spacing={0}>
                              <Icon
                                as={IoChevronUp}
                                size={12}
                                color={
                                  !column.isSorted
                                    ? 'gray.400'
                                    : !column.isSortedDesc
                                      ? 'gray.700'
                                      : 'gray.400'
                                }
                              />
                              <Icon
                                as={IoChevronDown}
                                size={12}
                                color={
                                  !column.isSorted
                                    ? 'gray.400'
                                    : column.isSortedDesc
                                      ? 'gray.700'
                                      : 'gray.400'
                                }
                              />
                            </VStack>
                          )}
                        </HStack>
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody maxH={300} overflowY="auto" {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <Tr
                      fontSize="sm"
                      cursor="pointer"
                      _hover={{ bg: 'muted.50' }}
                      {...row.getRowProps()}
                    >
                      {row.cells.map((cell) => (
                        <Td {...cell.getCellProps()} py={2}>{cell.render('Cell')}</Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
          <HStack spacing={2} justify="space-between" w="full"
            px={4} py={3} bg="gray.50" borderTopWidth="1px">
            <HStack flex={2}>
              <IconButton
                aria-label="Skip to start"
                variant="ghost"
                icon={<TfiAngleDoubleLeft />}
                isDisabled={!canPreviousPage}
                onClick={() => gotoPage(0)}
              />
              <IconButton
                aria-label="Go Previous"
                variant="ghost"
                icon={<TfiAngleLeft />}
                isDisabled={!canPreviousPage}
                onClick={previousPage}
              />
              <IconButton
                aria-label="Go Next"
                variant="ghost"
                icon={<TfiAngleRight />}
                isDisabled={!canNextPage}
                onClick={nextPage}
              />
              <IconButton
                aria-label="Skip to end"
                variant="ghost"
                icon={<TfiAngleDoubleRight />}
                isDisabled={!canNextPage}
                onClick={() => gotoPage(pageCount - 1)}
              />
            </HStack>
            <Text>
              Page{' '}
              <strong>
                {pageIndex + 1} of {pageOptions.length || 1}
              </strong>
            </Text>
            <Box h="6">
              <Divider orientation="vertical" />
            </Box>
            <HStack>
              <Text> Go to page : </Text>
              <Input
                value={pageNumber ? Number(pageNumber) : ''}
                textAlign="center"
                w="14"
                type="number"
                min={pageIndex + 1}
                max={pageOptions.length}
                onChange={(e) => {
                  handlePageValidation(e.target.value)
                  const pageNumber = e.target.value
                    ? Number(e.target.value) - 1
                    : 0;
                  gotoPage(pageNumber);
                }}
              />
            </HStack>
          </HStack>
        </Box>
      </VStack>
      <ConfirmDialog
        isOpen={isDialogOpen}
        title={actionType === PendingApprovalStatus.APPROVED ? "Approve Request" : "Reject Request"}
        message={
          selectedRow
            ? `Are you sure you want to ${actionType?.toLowerCase()} the request from ${selectedRow.requestedBy}?`
            : ""
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        confirmText={actionType === PendingApprovalStatus.APPROVED ? "Approve" : "Reject"}
        cancelText="Cancel"
      />
    </VStack>
  );
}

export default PendingApprovals;