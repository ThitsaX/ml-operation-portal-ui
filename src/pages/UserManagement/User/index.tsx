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
  useToast,
  Stack
} from '@chakra-ui/react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { usePagination, useSortBy, useTable, Column, CellProps, useGlobalFilter } from 'react-table';
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
  type IParticipantUserForm,
  IApiErrorResponse
} from '@typescript/services';
import { UserStatus } from '@typescript/form';
import { useGetOrganizationListByParticipant } from '@hooks/services/participant';
import { createUser } from '@services/participant';
import { GrPowerReset } from "react-icons/gr";
import ResetPasswordModal from '@components/interface/ResetPassword';
import GlobalFilter from '@components/interface/GlobalFilter';
import { store } from '@store'
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';

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


      toast({
        position: 'top',
        description: 'User status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || 'Failed to update user status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  const columns: Column<IParticipantUser>[] = useMemo(() => {
    return [
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Email</Text>
        ),
        accessor: "email",
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Name</Text>
        ),
        accessor: "name",
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Role</Text>
        ),
        accessor: "roleList",
        Cell: ({ value }: CellProps<IParticipantUser, string[]>) => {
          if (!value || value.length === 0) return <span>-</span>;
          return <span>{value.join(", ")}</span>;
        },
      },
      {
        Header: () => (
          <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">Status</Text>
        ),
        accessor: "status",
        disableSortBy: true,
        Cell: ({ value }) => (
          <Box textAlign="left" px={3}>
            {value}
          </Box>
        ),
      },
      {
        Header: () => (
          <Text fontWeight="semibold" fontSize="sm" textTransform="capitalize">Action</Text>
        ),
        id: "id",
        disableSortBy: true,
        Cell: ({ row }: CellProps<IParticipantUser>) => {
          const { user: { data: user } } = store.getState();

          const isDisabled = row.original.userId === user?.userId;

          return (
            <HStack spacing={3}>
              <IconButton
                icon={<GrPowerReset />}
                aria-label="Edit"
                size="md"
                onClick={() => handleResetClick(row.original)}
                variant="ghost"
                isDisabled={isDisabled}
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
                isDisabled={isDisabled}
              />
            </HStack>
          )
        }
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
    state: { pageIndex, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: filteredUsers,
      initialState: {
        pageIndex: 0,
        pageSize: 10
      }
    },
    useGlobalFilter,
    useSortBy,
    usePagination,

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
      .catch((error: IApiErrorResponse) => {
        toast({
          position: 'top',
          description: getErrorMessage(error) || 'Something went wrong',
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
  const statusOptions = [
      { value: 'All', label: 'All' },
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ];

  return (

    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>User Management</Heading>

      <Stack
        w="full"
        direction={{ base: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
      >

        <Box w={{ base: "full", sm: "200px" }}>
        <CustomSelect
          options={statusOptions}
          value={statusOptions.find(option => option.value === filterStatus) || null}
          onChange={(selectedOption) => {
            setFilterStatus(selectedOption?.value || '');
          }}
          placeholder="Select status"
          includeAllOption={false}
        />
        </Box>
        <Button
          colorScheme="blue"
          onClick={handleNewClick}
          w={{ base: "full", sm: "auto" }}>
          New User
        </Button>
      </Stack>

      <VStack w="full" align="flex-start" spacing={2} >
        <GlobalFilter mt={5} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

        <TableContainer
          w="full"
          borderWidth={1}
          borderColor="gray.100"
          rounded="lg"
          my={10}>
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

      </VStack>

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
