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
  Switch,
  Toast,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePagination, useSortBy, useTable, Column, CellProps } from 'react-table';
import EditUserModal from '@components/interface/EditUserModal';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight
} from 'react-icons/tfi';
import { FaRegEdit } from "react-icons/fa";
import { useGetUserListByParticipant } from '@hooks/services';
import { modifyUser, modifyUserStatus } from '@services/participant';
import {
  type IParticipantUser,
  type IModifyUser,
  type IParticipantUserForm
} from '@typescript/services';
import { UserStatus } from '@typescript/form';
import { useGetOrganizationListByParticipant } from '@hooks/services/participant';
import { createUser } from '@services/participant';
import { GrPowerReset } from "react-icons/gr";
import ResetPasswordModal from '@components/interface/ResetPassword';

const User = () => {
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filteredUsers, setFilteredUsers] = useState([] as IParticipantUser[]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState<String>('1');
  const [isEdit, setIsEdit] = useState(false);
  const toast = useToast();

  const { data: participantInfoList } = useGetOrganizationListByParticipant();
  const { data, refetch } = useGetUserListByParticipant();

  const [resetUser, setResetUser] = useState<{ userId: string; email: string } | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleResetClick = (user: IParticipantUser) => {
    setResetUser({ userId: user.userId, email: user.email });
    setIsResetOpen(true);
  };

  const toggleStatus = async (userId: string, checked: boolean) => {
    const newStatus = checked ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    try {
      await modifyUserStatus(userId, newStatus);
      await refetch();

      toast({
        position: 'top',
        description: 'User status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        position: 'top',
        description: error.message || 'Failed to update user status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  const columns: Column<IParticipantUser>[] = useMemo(() => {
    return [
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Role",
        accessor: "roleList",
        Cell: ({ value }: CellProps<IParticipantUser, string[]>) => {
          if (!value || value.length === 0) return <span>-</span>;
          return <span>{value.join(", ")}</span>;
        },
      },
      {
        Header: "Status",
        accessor: "status",
        disableSortBy: true,
      },
      {
        Header: "Action",
        disableSortBy: true,
        Cell: ({ row }: CellProps<IParticipantUser>) => (
          <HStack spacing={3}>
            <IconButton
              icon={<GrPowerReset />}
              aria-label="Edit"
              size="md"
              onClick={() => handleResetClick(row.original)}
              variant="ghost"
            />
            <IconButton
              icon={<FaRegEdit />}
              aria-label="Edit"
              size="md"
              onClick={() => handleEditClick(row.original)}
              variant="ghost"
            />
            <Switch
              colorScheme="green"
              size="sm"
              isChecked={row.original.status === "ACTIVE"}
              onChange={e =>
                toggleStatus(row.original.userId, e.target.checked)
              }
            />
          </HStack>
        ),
      },
    ];
  }, []);



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
    const filtered = data?.filter(user =>
      filterStatus === 'All' ? true : user.status === filterStatus
    ) ?? [];
    setFilteredUsers(filtered);
  }, [filterStatus, data])

  const handleEditClick = (user: IParticipantUser) => {
    setSelectedUser(user);
    setIsOpen(true);
    setIsEdit(true);
  }

  const handleNewClick = () => {
    setSelectedUser(null);
    setIsOpen(true);
    setIsEdit(false);
  };

  const handleSave = useCallback((values: IParticipantUserForm) => {

    const { firstName, lastName, confirmPassword, ...rest } = values;
    const name = `${firstName} ${lastName}`;
    const userData = { ...rest, name, firstName, lastName };

    if (isEdit) {
      userData.userId = selectedUser?.userId || userData.userId || '';
    } else {
      userData.status = UserStatus.ACTIVE;
    }

    const action = isEdit
      ? modifyUser(userData as IModifyUser)
      : createUser(userData);

    action
      .then(() => {
        toast({
          position: 'top',
          description: isEdit ? 'User updated successfully' : 'User created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsEdit(false);
        refetch();
        setIsOpen(false);
      })
      .catch((error: any) => {
        toast({
          position: 'top',
          description: error?.error_code || 'Something went wrong',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  }, [isEdit, toast, refetch, selectedUser]);

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
      <Heading size="md">User Management</Heading>

      <HStack w="full" justifyContent="space-between">
        <ChakraSelect
          width="200px"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="md"
          rounded="md"
          bg="white"
          borderColor="gray.300"
          focusBorderColor="blue.500"
          _hover={{ borderColor: "blue.400" }}
          _focus={{ boxShadow: "0 0 0 1px #3182CE" }}

        >
          <option value="All">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>

        </ChakraSelect >

        <Button colorScheme="blue" onClick={() => handleNewClick()}>New User</Button>
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
                    <Td {...cell.getCellProps()}
                      {...cell.getCellProps()}
                      py={1}   // ✅ reduce row height
                      px={3}
                      fontSize="sm">{cell.render('Cell')}</Td>
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
        participantInfoList={participantInfoList}
        onSave={handleSave}
      />

      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        user={resetUser}
        onSuccess={refetch}
      />

    </VStack>
  );
};

export default User;
