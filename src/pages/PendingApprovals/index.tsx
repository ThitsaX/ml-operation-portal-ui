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
  Icon
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { useGetPendingApprovalList } from '@hooks/services';
import { IPendingApproval, PendingApprovalStatus } from '@typescript/services/pending-approvals';
import { modifyApprovalAction } from '@services/pending-approvals'
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

import { usePagination, useSortBy, useTable, Column } from 'react-table';
import { ConfirmDialog } from '../../components/interface/ConfirmationDialog';


const PendingApprovals = () => {
  const toast = useToast();
  const { data, isError, error, refetch } = useGetPendingApprovalList();

  // State
  const [tableData, setTableData] = useState<IPendingApproval[]>([]);
  const [pageNumber, setPageNumber] = useState<String>('1');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<IPendingApproval | null>(null);
  const [actionType, setActionType] = useState<PendingApprovalStatus | null>(null);

  useEffect(() => {
    if (data) {
      setTableData(data);
    }
  }, [data]);

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
          title: 'Approved',
          description: `${row.requestedBy}'s request ${actionType}.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        refetch();
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: error?.message || `Failed to ${actionType} request.`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  };

  // Table setup
  const columns = useMemo(
    () => [
      {
        Header: 'Requested Action',
        accessor: 'requestedAction'
      },
      {
        Header: 'DFSP',
        accessor: 'dfsp'
      },
      {
        Header: 'Currency',
        accessor: 'currency'
      },
      {
        Header: 'Amount',
        accessor: 'amount'
      },
      {
        Header: 'Requested By',
        accessor: 'requestedBy'
      },
      {
        Header: 'Requested Date Time',
        accessor: 'requestedDateTime',
        Cell: ({ value }: any) => moment(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        Header: 'Action',
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
    ],
    []
  ) as Column<IPendingApproval>[];

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
    state: { pageIndex }
  } = useTable(
    {
      columns,
      data: tableData,
      initialState: {
        pageIndex: 0,
        pageSize: 10
      }
    },
    useSortBy,
    usePagination
  );

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
    <VStack align="flex-start" w="full" p={8} spacing={8}>
      <Heading size="md">Pending Approvals</Heading>

      {isError && <Text color="red.500">{String(error)}</Text>}

      {!isError && (
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
                        <Text flex={1}>{column.render('Header')}</Text>
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
                      <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                    ))}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <HStack px="6" py="2">
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
        </TableContainer>
      )}

      <ConfirmDialog
        isOpen={isDialogOpen}
        title={actionType === PendingApprovalStatus.APPROVED ? "Approve Request" : "Reject Request"}
        message={
          selectedRow
            ? `Are you sure you want to ${actionType} the request from ${selectedRow.requestedBy}?`
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