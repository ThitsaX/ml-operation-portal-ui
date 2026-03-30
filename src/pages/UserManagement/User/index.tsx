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
  Icon,
  Divider,
  Switch,
  useToast,
  Stack,
  Tooltip
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
import { createUser, modifyUser, modifyUserStatus } from '@services/user';
import {
  type IParticipantUser,
  type IModifyUser,
  type IParticipantUserForm,
  type IApiErrorResponse
} from '@typescript/services';
import { UserStatus } from '@typescript/form';
import { useGetOrganizationListByParticipant } from '@hooks/services/participant';
import { GrPowerReset } from "react-icons/gr";
import ResetPasswordModal from '@components/interface/ResetPassword';
import GlobalFilter from '@components/interface/GlobalFilter';
import { store } from '@store'
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';
import { hasActionPermission } from '@helpers/permissions';
import { useTranslation } from 'react-i18next';

const User = () => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filteredUsers, setFilteredUsers] = useState([] as IParticipantUser[]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pageNumber, setPageNumber] = useState<String>('1');
  const [isEdit, setIsEdit] = useState(false);

  const toast = useToast();
  const { data: participantInfoList, } = useGetOrganizationListByParticipant();
  const { data,isError, error, refetch } = useGetUserListByParticipant();

  const [resetUser, setResetUser] = useState<{ userId: string; email: string } | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      if (isError) {
        toast({
          title: t('ui.failed_to_fetch_users'),
          position: 'top',
          description: getErrorMessage(error as IApiErrorResponse) || t('ui.something_went_wrong'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }, [isError, error, toast, t]);

  const handleResetClick = (user: IParticipantUser) => {
    setResetUser({ userId: user.userId, email: user.email });
    setIsResetOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsOpen(false);
  };

  const toggleStatus = async (userId: string, checked: boolean) => {
    const newStatus = checked ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    try {
      await modifyUserStatus(userId, newStatus);
      toast({
        position: 'top',
        description: t('ui.user_status_updated_successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || t('ui.failed_to_update_user_status'),
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
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.email')}</Text>
        ),
        accessor: "email",
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.organization')}</Text>
        ),
        accessor: "participantName",
        Cell: ({ row }: CellProps<IParticipantUser>) => {
          const { participantName, participantDescription } = row.original;
          return (
            <Box
              whiteSpace="normal"
              wordBreak="break-word"
              overflowWrap="break-word"
            >
              {participantName ? participantDescription ? `${participantName} (${participantDescription})` : participantName : '-'}
            </Box>
          );
        },
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.name')}</Text>
        ),
        accessor: "name",
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.role')}</Text>
        ),
        accessor: "roleList",
        Cell: ({ value }: CellProps<IParticipantUser, string[]>) => {
          if (!value || value.length === 0) return <span>-</span>;
          return (
            <Box
              whiteSpace="normal"
              wordBreak="break-word"
              overflowWrap="break-word"
            >
              {value.join(", ")}
            </Box>
          );
        },
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.status')}</Text>
        ),
        accessor: "status",
        disableSortBy: true,
        Cell: ({ value }) => (
          <Box textAlign="left">
            {value}
          </Box>
        ),
      },
      {
        Header: () => (
          <Text flex={1} textAlign={'center'} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{t('ui.action')}</Text>
        ),
        id: "id",
        disableSortBy: true,
        Cell: ({ row }: CellProps<IParticipantUser>) => {
          const { user: { data: user } } = store.getState();
          const isSelfUser = row.original.userId === user?.userId;

          return (
            <HStack justify="center" spacing={3}>
              <Tooltip label={t('ui.reset_password')} placement="top">
                <IconButton
                  icon={<GrPowerReset />}
                  aria-label={t('ui.reset_password')}
                  size="md"
                  onClick={() => handleResetClick(row.original)}
                  variant="ghost"
                  isDisabled={isSelfUser || !hasActionPermission("ResetCurrentPassword")}
                />
              </Tooltip>
              <Tooltip label={t('ui.edit_user')} placement="top">
                <IconButton
                  icon={<FaRegEdit />}
                  aria-label={t('ui.edit')}
                  size="md"
                  onClick={() => handleEditClick(row.original)}
                  variant="ghost"
                  isDisabled={!hasActionPermission("ModifyUser")}
                />
              </Tooltip>  
              <Switch
                colorScheme="green"
                size="sm"
                isChecked={row.original.status === "ACTIVE"}
                onChange={e =>
                  toggleStatus(row.original.userId, e.target.checked)
                }
                isDisabled={isSelfUser || !hasActionPermission("ModifyUserStatus")}
              />
            </HStack>
          )
        }
      },
    ];
  }, [t]);



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
        setPageNumber(String(pageIndex + 1));
  }, [pageIndex]);

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
    setIsSaving(true);
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
          description: isEdit ? t('ui.user_updated_successfully') : t('ui.user_created_successfully'),
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setIsEdit(false);
        refetch();
        handleCloseModal();
      })
      .catch((error: IApiErrorResponse) => {
        toast({
          position: 'top',
          description: getErrorMessage(error) || t('ui.something_went_wrong'),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }).finally(() => {
      setIsSaving(false);
    });
  }, [isEdit, toast, refetch, selectedUser, t]);

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
    { value: 'All', label: t('ui.all') },
    { value: 'ACTIVE', label: t('ui.active') },
    { value: 'INACTIVE', label: t('ui.inactive') },
  ];

  return (

    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.user_management')}</Heading>

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
            placeholder={t('ui.select_status')}
            includeAllOption={false}
          />
        </Box>
        {hasActionPermission("CreateUser") && (
          <Button
            colorScheme="blue"
            onClick={handleNewClick}
            w={{ base: "full", sm: "auto" }}>
            {t('ui.add_new_user')}
          </Button>
        )}
      </Stack>

      <VStack w="full" align="flex-start" spacing={2} >
        <GlobalFilter mt={5} globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

        <Box w="full">
        <TableContainer
          w="full"
          borderWidth={1}
          borderColor="gray.100"
          rounded="lg">
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
                        py={1}   // ✅ reduce row height
                        fontSize="sm">{cell.render('Cell')}</Td>
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
                aria-label={t('ui.skip_to_start')}
                variant="ghost"
                icon={<TfiAngleDoubleLeft />}
                isDisabled={!canPreviousPage}
                onClick={() => gotoPage(0)}
              />
              <IconButton
                aria-label={t('ui.go_previous')}
                variant="ghost"
                icon={<TfiAngleLeft />}
                isDisabled={!canPreviousPage}
                onClick={previousPage}
              />
              <IconButton
                aria-label={t('ui.go_next')}
                variant="ghost"
                icon={<TfiAngleRight />}
                isDisabled={!canNextPage}
                onClick={nextPage}
              />
              <IconButton
                aria-label={t('ui.skip_to_end')}
                variant="ghost"
                icon={<TfiAngleDoubleRight />}
                isDisabled={!canNextPage}
                onClick={() => gotoPage(pageCount - 1)}
              />
            </HStack>
            <Text>
              {t('ui.page')}{' '}
              <strong>
                {pageIndex + 1} {t('ui.of')} {pageOptions.length || 1}
              </strong>
            </Text>
            <Box h="6">
              <Divider orientation="vertical" />
            </Box>
            <HStack>
              <Text>{t('ui.go_to_page')}</Text>
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

      <EditUserModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        selectedUser={selectedUser}
        isEdit={isEdit}
        participantInfoList={participantInfoList}
        onSave={handleSave}
        isSaving={isSaving} 
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
