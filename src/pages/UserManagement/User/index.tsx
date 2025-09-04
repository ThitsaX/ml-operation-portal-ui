import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack,
  Heading,
  Text,
  Select as ChakraSelect,
  Icon,
  Divider,
  Switch
} from '@chakra-ui/react';
import { useEffect, useState, useMemo } from 'react';
import { usePagination, useSortBy, useTable, Row, Column } from 'react-table';
import { FiEdit, FiToggleRight } from 'react-icons/fi';
import Select from 'react-select';
import EditUserModal from '@components/interface/EditUserModal';
import { IGetUserDataList, IGetUserData } from '@typescript/form';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight
} from 'react-icons/tfi';
import { FaRegEdit } from "react-icons/fa";

// Sample data
const usersData: IGetUserData[] = [

  {
    "email": 'testuser1@gmail.com',
    "name": 'Test User One',
    "role": 'DFSP - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser2@gmail.com',
    "name": 'Test User Two',
    "role": 'DFSP - Operation',
    "status": 'Active'
  },
  {
    "email": 'testuser3@gmail.com',
    "name": 'Test User Three',
    "role": 'HUB - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser4@gmail.com',
    "name": 'Test User Four',
    "role": 'HUB - Manager',
    "status": 'Active'
  },
  {
    "email": 'testuser5@gmail.com',
    "name": 'Test User Five',
    "role": 'HUB - User',
    "status": 'Inactive'
  },
  {
    "email": 'testuser1@gmail.com',
    "name": 'Test User One',
    "role": 'DFSP - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser2@gmail.com',
    "name": 'Test User Two',
    "role": 'DFSP - Operation',
    "status": 'Active'
  },
  {
    "email": 'testuser3@gmail.com',
    "name": 'Test User Three',
    "role": 'HUB - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser4@gmail.com',
    "name": 'Test User Four',
    "role": 'HUB - Manager',
    "status": 'Active'
  },
  {
    "email": 'testuser5@gmail.com',
    "name": 'Test User Five',
    "role": 'HUB - User',
    "status": 'Inactive'
  },
  {
    "email": 'testuser1@gmail.com',
    "name": 'Test User One',
    "role": 'DFSP - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser2@gmail.com',
    "name": 'Test User Two',
    "role": 'DFSP - Operation',
    "status": 'Active'
  },
  {
    "email": 'testuser3@gmail.com',
    "name": 'Test User Three',
    "role": 'HUB - Admin',
    "status": 'Active'
  },
  {
    "email": 'testuser4@gmail.com',
    "name": 'Test User Four',
    "role": 'HUB - Manager',
    "status": 'Active'
  },
  {
    "email": 'testuser5@gmail.com',
    "name": 'Test User Five',
    "role": 'HUB - User',
    "status": 'Inactive'
  }
];

type OptionType = {
  value: string;
  label: string;
};

const roleOptions: OptionType[] = [
  { value: 'HUB - admin', label: 'HUB - admin' },
  { value: 'HUB - manager', label: 'HUB - manager' },
  { value: 'DFSP - admin', label: 'DFSP - admin' },
];

const User = () => {
  const [filterStatus, setFilterStatus] = useState('Active');
  const [filteredUsers, setFilteredUsers] = useState(usersData);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState<String>('1');
  const [isEdit, setIsEdit] = useState(false);

  const toggleStatus = (email: string, newValue: boolean) => {
    setFilteredUsers(prev =>
      prev.map(user =>
        user.email === email
          ? { ...user, status: newValue ? 'Active' : 'Inactive' }
          : user
      )
    );
  };

  const columns: Column<IGetUserData>[] = useMemo(
    () => [
      {
        Header: 'Email',
        accessor: 'email',
      },
      {
        Header: 'Name',
        accessor: 'name'
      },
      {
        Header: 'Role',
        accessor: 'role',
      },
      {
        Header: 'Status',
        accessor: 'status',
        disableSortBy: true
      },
      {
        Header: 'Action',
        disableSortBy: true,
        Cell: ({ row }: { row: Row<IGetUserData> }) => (

          <HStack spacing={3}>
            <IconButton
              icon={<FaRegEdit />}
              aria-label="Edit"
              size="lg"
              onClick={() => handleEditClick(row.original)}
              variant="ghost"
            />
            {/* <IconButton
              icon={<FiToggleRight />}
              aria-label="Toggle"
              size="sm"
              variant="outline"
              colorScheme="green"
            /> */}

            <Switch
              colorScheme="green"
              isChecked={row.original.status === 'Active'}
              onChange={(e) => toggleStatus(row.original.email, e.target.checked)}
            />
          </HStack>
        )
      }
    ],
    []
  );


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
      data: filteredUsers,
      initialState: {
        pageIndex: 0,
        pageSize: 10
      }
    },
    useSortBy,
    usePagination
  );


  useEffect(() => {
    const filtered = usersData.filter(user =>
      filterStatus === 'All' ? true : user.status === filterStatus
    );
    setFilteredUsers(filtered);
  }, [filterStatus]);

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setIsOpen(true);
    setIsEdit(true);
  };

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
    <VStack w="full" align="flex-start" spacing={6} p={4}>
      <Heading size="lg">User Management</Heading>

      <HStack w="full" justifyContent="space-between">
        <ChakraSelect
          width="200px"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="All">All</option>
        </ChakraSelect >

        <Button colorScheme="blue" onClick={() => handleEditClick({})}>New User</Button>
      </HStack>

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

      <EditUserModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedUser={selectedUser}
        isEdit={isEdit}
      />
    </VStack>
  );
};

export default User;
