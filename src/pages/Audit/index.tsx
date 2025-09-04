import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
  Divider,
  IconButton,
  Text,
  Select,
  Icon
} from '@chakra-ui/react';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight
} from 'react-icons/tfi';
import { useLoadingContext } from '@contexts/hooks';
import { getRequestErrorMessage } from '@helpers/errors';
import { AuditHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetActionList, useGetAllAudit, useGetMadeByList } from '@hooks/services';
import { useGetUserState } from '@store/hooks';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { IGetAuditByParticipant } from '@typescript/form';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { usePagination, useSortBy, useTable } from 'react-table';
import { Controller, useForm } from 'react-hook-form';
import { isNumber, isEmpty } from 'lodash-es';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

const auditHelper = new AuditHelper();

const Audit = () => {
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [tableData, setTableData] = useState<IGetAuditByParticipant[]>([]);
  const [pageNumber, setPageNumber] = useState<String>('1')

  /* Redux */
  const { data: user } = useGetUserState();

  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );
  
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  /* React Query */
  const { data: madeByList } = useGetMadeByList();
  const { data: actionNames } = useGetActionList();

  const { data, mutateAsync } = useGetAllAudit();

  useEffect(() => {
    if (data) {
      setTableData(data);
    }
  }, [data]);



  /* Form */
  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid, errors, defaultValues },
    getValues,
    setValue,
    reset
  } = useForm<IGetAuditByParticipantValues>({
    defaultValues: {
      participantId: user?.participantId,
      fromDate: moment().tz(selectedTZString).startOf('d').unix(),
      toDate: moment().tz(selectedTZString).endOf('d').unix(),
      userId: '',
      actionName: '',
    },
    resolver: zodResolver(auditHelper.schema),
    mode: 'onChange'
  });

  const onSearchHandler = useCallback(
    (values: IGetAuditByParticipantValues) => {
      const payload = {
        ...values,
        participantId: values.participantId || user?.participantId || '',
      };

      start();
      mutateAsync(payload)
        .catch((err) => {
          toast({
            position: 'top',
            description: getRequestErrorMessage(err),
            status: 'error',
            isClosable: true,
            duration: 3000
          });
        })
        .finally(() => complete());
    },
    [complete, mutateAsync, start, toast, user?.participantId]
  );

  // Pagination start here
  const columns = useMemo<
    { Header: string; accessor: keyof IGetAuditByParticipant }[]
  >(
    () => [
      {
        Header: 'DATE',
        accessor: 'actionDate'
      },
      {
        Header: 'ACTION',
        accessor: 'actionName'
      },
      {
        Header: 'MADE BY',
        accessor: 'userName'
      }
    ],
    []
  );

  const {
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
    }
    else if (value.startsWith('0')) {
      setPageNumber('')
    }
    else {
      setPageNumber(value)
    }
  }

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4}>
      <VStack align="flex-start">
        <Heading fontSize="3xl">Audit</Heading>
      </VStack>
      <VStack align="flex-start" alignSelf="stretch" spacing="4" gap={4} w="full">
        <HStack alignItems="flex-start" alignSelf="stretch">
          {/* Hidden participantId to ensure it's included in submission */}

          <FormControl isInvalid={!isEmpty(errors.fromDate)}>
            <FormLabel>From</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <Input
                    type="date"
                    value={moment
                      .unix(value)
                      .tz(selectedTZString)
                      .format('YYYY-MM-DD')}
                    onChange={(event) => {
                      const date = moment(event.target.value, 'YYYY-MM-DD')
                        .startOf('day')
                        .unix();
                      onChange(date);
                      trigger('toDate');
                    }}
                  />
                );
              }}
              name="fromDate"
            />
            <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.toDate)}>
            <FormLabel>To</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <Input
                    type="date"
                    value={moment
                      .unix(value)
                      .tz(selectedTZString)
                      .format('YYYY-MM-DD')}
                    onChange={(event) => {
                      const date = moment(event.target.value, 'YYYY-MM-DD')
                        .endOf('day')
                        .unix();
                      onChange(date);
                      trigger('fromDate');
                    }}
                  />
                );
              }}
              name="toDate"
            />
            <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Action</FormLabel>
            <Controller
              control={control}
              name="actionName"
              render={({ field }) => (
                <Select {...field} placeholder="All">
                  {actionNames?.map((item) => (
                    <option key={item.actionId} value={item.actionName}>
                      {item.actionName}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <FormControl>
            <FormLabel>MadeBy</FormLabel>
            <Controller
              control={control}
              name="userId"
              render={({ field }) => (
                <Select {...field} placeholder="All">
                  {madeByList?.map((action) => (
                    <option key={action.userId} value={action.userId}>
                      {action.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </HStack>
        <Box w="full" display="flex" justifyContent="flex-end">
          <Button
            colorScheme="brand"
            isDisabled={!isValid}
            onClick={handleSubmit(onSearchHandler)}>
            Search
          </Button>
        </Box>
      </VStack>

      <TableContainer
        w="full"
        borderWidth={1}
        borderBottom={0}
        borderColor="gray.100"
        rounded="lg">
        <Table variant="simple">
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
          <Tbody>
            {page.map((row, index) => {
              prepareRow(row);
              return (
                <Tr
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ bg: 'muted.50' }}
                  {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <Td {...cell.getCellProps()}>
                      {isNumber(cell.value)
                        ? moment
                          .unix(cell.value)
                          .tz(selectedTZString)
                          .format('DD/MM/YYYY hh:mm:ss A')
                        : cell.value}
                    </Td>
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
  );
};

export default Audit;
