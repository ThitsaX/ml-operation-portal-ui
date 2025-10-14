import { useState, useEffect, memo, useMemo, lazy, Suspense } from 'react';
import {
  Flex,
  Heading,
  Input,
  Button,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  HStack,
  Text,
  VStack,
  IconButton,
  Divider,
  Icon,
  Collapse,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransferHelper } from '@helpers/form';
import { omitBy, isEmpty } from 'lodash-es';
import { useGetUserState } from '@store/hooks';
import { useLoadingContext } from '@contexts/hooks';
import { getErrorMessage } from '@helpers/errors';
import { ITransferValues } from '@typescript/form/transfer';
import {
  useGetAllOtherParticipants,
  useGetAllIdTypes,
  useGetAllTransferStates,
  useGetParticipantCurrencyList
} from '@hooks/services';
import { getAllTransfers } from '@services/transfer';
import { IGetTransferData, IApiErrorResponse } from '@typescript/services';
import moment from 'moment';
import { usePagination, useSortBy, SortByFn, useTable, Row, Column } from 'react-table';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight
} from 'react-icons/tfi';
import { Ranges, TransferType } from '@typescript/pages';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';

const TransferDetails = lazy(() => import('./TransferDetails'));

const transferHelper = new TransferHelper();

const Transfer = () => {
  const toast = useToast();
  const { start, complete } = useLoadingContext();

  // For Modal
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Redux
  const user = useGetUserState();

  // React Query on mount to get necessary data
  const participantRes = useGetAllOtherParticipants();
  const idTypeRes = useGetAllIdTypes();
  const tranStateRes = useGetAllTransferStates();
  const { data: currencyList } = useGetParticipantCurrencyList();

  // State
  const [transferType, setTransferType] = useState<TransferType>('inbound');
  const [dateRange, setDateRange] = useState<Ranges>('oneDay');
  const [transferData, setTransferData] = useState<IGetTransferData[]>([]);
  const [transferId, setTransferId] = useState<string>('');
  const { isOpen: isToggle, onToggle } = useDisclosure();

  // Pagination
  const [pageIndex, setPageIndex] = useState<number>(1); // start from 1
  const [pageNumber, setPageNumber] = useState<number>(1); // for input
  const [pageSize, setPageSize] = useState<number>(10); // make it mutable

  const [totalPages, setTotalPages] = useState<number>(1);

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  //Selected timezone offset
  const selectedTZString = selectedTimezone.value;
  const timezone = selectedTimezone.offset === 0
    ? "0000"
    : moment().tz(selectedTZString).format('ZZ').replace('+', '');

  //Form initial values
  const initialValues = {
    payeeFspId: '',
    payerFspId: '',
    fromDate: moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm'),
    toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
    transferId: '',
    currencyId: '',
    transferStateId: '',
    payerIdentifierTypeId: '',
    payeeIdentifierTypeId: '',
    payerIdentifierValue: '',
    payeeIdentifierValue: '',
    timezone: timezone,
  }

  const isHubUser =
    typeof user.data?.participantName === 'string' &&
    user.data.participantName.toLowerCase() === 'hub';

  // Form
  const {
    control,
    setFocus,
    register,
    setValue,
    reset,
    trigger,
    handleSubmit,
    formState: { errors }
  } = useForm<ITransferValues>({
    defaultValues: initialValues,
    mode: 'onChange',
    resolver: zodResolver(transferHelper.schema)
  });

  // Handlers
  const onChangeTransferType = useCallback(
    (type: TransferType) => {
      if (type === 'inbound') {
        setValue('payerFspId', '', { shouldDirty: true, shouldValidate: true });
        setValue('payeeFspId', user.data?.participantName, { shouldDirty: true });
      } else {
        setValue('payerFspId', user.data?.participantName, { shouldDirty: true });
        setValue('payeeFspId', '', { shouldDirty: true, shouldValidate: true });
      }
      setTransferType(type);
    },
    [setValue, user.data?.participantName]
  );

  const onChangeDateRange = useCallback(
    (range: Ranges) => {
      let from: string;
      let to: string;

      switch (range) {
        case 'oneDay':
          from = moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm');
          break;
        case 'today':
          from = moment().tz(selectedTZString).startOf('d').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).endOf('d').format('YYYY-MM-DDTHH:mm');
          break;
        case 'twoDay':
          from = moment().tz(selectedTZString).subtract(2, 'd').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm');
          break;
        case 'oneWeek':
          from = moment().tz(selectedTZString).subtract(1, 'w').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm');
          break;
        case 'oneMonth':
          from = moment().tz(selectedTZString).subtract(1, 'month').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm');
          break;
        case 'oneYear':
          from = moment().tz(selectedTZString).subtract(1, 'y').format('YYYY-MM-DDTHH:mm');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm');
          break;
        case 'custom':
          setDateRange(range);
          return;
          break;
      }

      setDateRange(range);

      setValue('fromDate', from);
      setValue('toDate', to);
    },
    [setValue, selectedTimezone]
  );

  const onSelectedTimezoneChange = useCallback(() => {
    reset()
    const options = { shouldValidate: true, shouldDirty: true }
    setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm'), options)
    setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'), options)
    setValue('timezone', timezone, options)
  }, [selectedTimezone]);

  // Reseting values as soon as timezone change
  useEffect(() => {
    reset(initialValues)
    if (!isHubUser) {
      onChangeTransferType('inbound');
    }
    onChangeDateRange('oneDay');
    setTransferData([]);
  }, [selectedTimezone])

  const onFindHandler = useCallback(
    (values: ITransferValues, currentPage = 1, currentSize = 10) => {
      const currentTimeZone = moment.tz.guess();

      values.fromDate = moment
        .utc(values.fromDate)
        .tz(selectedTZString ? selectedTZString : currentTimeZone)
        .utc()
        .format();
      values.toDate = moment
        .utc(values.toDate)
        .tz(selectedTZString ? selectedTZString : currentTimeZone)
        .utc()
        .format();
      values.timezone = timezone;

      start();
      getAllTransfers(omitBy(values, isEmpty), currentPage, currentSize)  // number of rows per page)
        .then((data) => {
          setTransferData(data.transferInfoList);
          setTotalPages(Math.ceil(data.totalPage / currentSize));
          setPageNumber(currentPage);
        })
        .catch((error: IApiErrorResponse) => {
          toast({
            position: 'top',
            title: getErrorMessage(error),
            status: 'error',
            isClosable: true,
            duration: 3000
          });
        })
        .finally(() => {
          complete();
        });
    },
    [complete, start, toast, pageIndex, pageSize]
  );

  const onCancelHandler = useCallback(() => {
    reset()
    onChangeTransferType('inbound');
    onChangeDateRange('oneDay');
    onSelectedTimezoneChange();

    setTransferData([]);
  }, [onChangeDateRange, onChangeTransferType, reset, selectedTimezone]);

  const onTrClickHandler = useCallback(
    (id: string) => {
      setTransferId(id);
      onOpen();
    },
    [onOpen]
  );

  //Number Sorting
  const numberSort: SortByFn<IGetTransferData> = (rowA, rowB) => {
    const a = Number(rowA.values.amount);
    const b = Number(rowB.values.amount);

    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  };

  const columns = useMemo<Column<IGetTransferData>[]>(
    () => [
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Transfer ID</Text>
        ),
        accessor: 'transferId', // accessor is the "key" in the data
        disableSortBy: true
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">State</Text>
        ),
        accessor: 'state'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Type</Text>
        ),
        accessor: 'type',
        disableSortBy: true
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Currency</Text>
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
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Amount</Text>
        ),
        accessor: 'amount',
        sortType: numberSort,
        Cell: ({ value }) => (
          <Text textAlign="right">
            {value}
          </Text>
        ),
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Payer DFSP</Text>
        ),
        accessor: 'payerDfsp'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Payee DFSP</Text>
        ),
        accessor: 'payeeDfsp'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Settlement Batch</Text>
        ),
        accessor: 'settlementBatch',
        disableSortBy: true,
        Cell: ({ value }) => (
          <Text textAlign="right">
            {value}
          </Text>
        ),
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Date Submitted</Text>
        ),
        accessor: 'submittedOnDate'
      }
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows, // ✅ use rows instead of page
    prepareRow,
  } = useTable(
    {
      columns,
      data: transferData,
      manualPagination: true, // ✅ tell react-table we handle pagination
      pageCount: totalPages,  // ✅ inform how many pages there are
    },
    useSortBy
  );

  useEffect(() => {
    setFocus('transferId');

    if (!isHubUser) {
      onChangeTransferType('inbound');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const handlePageValidation = (value: string) => {
  //   if (Number(value) > pageOptions.length) {
  //     setPageNumber(pageNumber)
  //   } else if (value.startsWith('0')) {
  //     setPageNumber('')
  //   } else {
  //     setPageNumber(value)
  //   }
  // }

  return (
    <Flex justify="center" flexDirection="column" flex={1} p="2">
      {transferId && (
        <Suspense fallback={null}>
          <TransferDetails
            isOpen={isOpen}
            onClose={onClose}
            transferId={transferId}
          />
        </Suspense>
      )}

      <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
        <Heading fontSize="2xl" mb={6}>Transfer Overview</Heading>
      </VStack>

      <Flex
        flexWrap="wrap"
        w="100%"
        my="4"
        gap={{ base: 4, md: 4 }}
        alignItems="stretch"
      >
        <Flex
          flex={{ base: '1 1 100%', md: '1 1 0' }}
          flexDirection="column"
          p={{ base: 3, md: 2 }}
          gap="2"
          minW={{ md: 0 }}
        >
          <FormControl isInvalid={!isEmpty(errors.transferId)}>
            <Input
              type="input"
              placeholder="Transfer ID"
              borderColor="gray.300"
              {...register('transferId')}
            />
            <FormErrorMessage>{errors.transferId?.message}</FormErrorMessage>
          </FormControl>

          <Select
            value={dateRange}
            onChange={(e) => onChangeDateRange(e.target.value as Ranges)}>
            <option value="oneDay">Past 24 Hours</option>
            <option value="today">Today</option>
            <option value="twoDay">Past 48 Hours</option>
            <option value="oneWeek">Past Week</option>
            <option value="oneMonth">Past Month</option>
            <option value="oneYear">Past Year</option>
            <option value="custom">Custom Range</option>
          </Select>
          <Select
            disabled={isHubUser}
            value={transferType}
            onChange={(e) =>
              onChangeTransferType(e.target.value as TransferType)
            }>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </Select>
          <FormControl isInvalid={!isEmpty(errors.payerFspId)}>
            {(isHubUser || transferType === 'inbound') ? (
              <Select placeholder="Payer FSP ID"  {...register('payerFspId')}>
                {participantRes?.data?.participantInfoList.map(
                  (item, index) => {
                    return (
                      <option key={index} value={item.participantName}>
                        {item.participantName}
                      </option>
                    );
                  }
                )}
              </Select>
            ) : (
              <Input
                type="input"
                {...register('payerFspId')}
                value={user.data?.participantName}
                readOnly
              />
            )}

            <FormErrorMessage>{errors.payerFspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.payeeFspId)}>
            {isHubUser ? (<Select placeholder="Payee FSP ID"  {...register('payeeFspId')}>
              {participantRes?.data?.participantInfoList.map(
                (item, index) => {
                  return (
                    <option key={index} value={item.participantName}>
                      {item.participantName}
                    </option>
                  );
                }
              )}
            </Select>
            ) :
              transferType === 'inbound' ? (
                <Input
                  type="input"
                  {...register('payeeFspId')}
                  value={user.data?.participantName}
                  readOnly
                />
              ) : (
                <Select placeholder="Payee FSP ID"  {...register('payeeFspId')}>
                  {participantRes?.data?.participantInfoList.map(
                    (item, index) => {
                      return (
                        <option key={index} value={item.participantName}>
                          {item.participantName}
                        </option>
                      );
                    }
                  )}
                </Select>
              )}

            <FormErrorMessage>{errors.payeeFspId?.message}</FormErrorMessage>
          </FormControl>
        </Flex>

        <Flex
          flex={{ base: '1 1 100%', md: '1 1 0' }}
          flexDirection="column"
          p={{ base: 3, md: 2 }}
          gap="2"
          minW={{ md: 0 }}
        >
          <FormControl isInvalid={!isEmpty(errors.transferStateId)}>
            <Select
              placeholder="Transfer State"
              {...register('transferStateId')}>
              {tranStateRes?.data?.transferStateInfoList.map((item, index) => {
                return (
                  <option key={index} value={item.transferStateId}>
                    {item.transferState}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>
              {errors?.transferStateId?.message}
            </FormErrorMessage>
          </FormControl>


          <FormControl isInvalid={!isEmpty(errors.fromDate)} isRequired>
            {selectedTZString ?
              <Controller
                control={control}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Input
                      disabled={dateRange !== 'custom' ? true : false}
                      type="datetime-local"
                      value={value ? moment(value).format('YYYY-MM-DDTHH:mm') : initialValues.fromDate}
                      onChange={(event) => {
                        const date = moment(event.target.value, 'YYYY-MM-DDTHH:mm').toString()
                        trigger('fromDate')
                        onChange(date);
                      }}
                      borderWidth="1px"
                      _disabled={{
                        cursor: 'not-allowed',
                        opacity: 1
                      }}
                    />
                  );
                }}
                name="fromDate"
              /> : <p>Loading</p>}
            <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.currencyId)}>
            <Select placeholder="Select Currency" {...register('currencyId')}>
              {currencyList?.map((item, index) => (
                <option key={index} value={item.currency}>
                  {item.currency}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.payerIdentifierTypeId)}>
            <Select
              placeholder="Payer ID Type"
              {...register('payerIdentifierTypeId')}>
              {idTypeRes?.data?.idTypeInfoList.map((item, index) => {
                return (
                  <option key={index} value={item.partyIdentifierTypeId}>
                    {item.name}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>
              {errors.payerIdentifierTypeId?.message}
            </FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.payeeIdentifierTypeId)}>
            <Select
              placeholder="Payee ID Type"
              {...register('payeeIdentifierTypeId')}>
              {idTypeRes?.data?.idTypeInfoList.map((item, index) => {
                return (
                  <option key={index} value={item.partyIdentifierTypeId}>
                    {item.name}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>
              {errors.payeeIdentifierTypeId?.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>

        <Flex
          flex={{ base: '1 1 100%', md: '1 1 0' }}
          flexDirection="column"
          p={{ base: 3, md: 2 }}
          gap="2"
          minW={{ md: 0 }}
        >
          <Box h="40px"></Box>
          <FormControl isInvalid={!isEmpty(errors.toDate)} isRequired>
            {selectedTZString ?
              <Controller
                control={control}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Input
                      disabled={dateRange !== 'custom' ? true : false}
                      type="datetime-local"
                      value={value ? moment(value).format('YYYY-MM-DDTHH:mm') : initialValues.toDate}
                      onChange={(event) => {
                        const date = moment(event.target.value, 'YYYY-MM-DDTHH:mm').toString()
                        trigger('toDate')
                        onChange(date);
                      }}
                      borderWidth="1px"
                      borderRadius="md"
                      _disabled={{
                        cursor: 'not-allowed',
                        opacity: 1
                      }}
                    />
                  );
                }}
                name="toDate"
              />
              : <p>Loading</p>}
            <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
          </FormControl>
          <Box h="40px"></Box>
          <FormControl isInvalid={!isEmpty(errors.payerIdentifierValue)}>
            <Input
              type="input"
              placeholder="Payer ID Value"
              {...register('payerIdentifierValue')}
            />
            <FormErrorMessage>
              {errors.payerIdentifierValue?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.payeeIdentifierValue)}>
            <Input
              type="input"
              placeholder="Payee ID Value"
              {...register('payeeIdentifierValue')}
            />
            <FormErrorMessage>
              {errors.payeeIdentifierValue?.message}
            </FormErrorMessage>
          </FormControl>
        </Flex>
      </Flex>

      <Flex justify="flex-end" flex={1} gap={5}>
        <Button onClick={onCancelHandler}>Clear Filter</Button>

        <Button
          color="white"
          bg="primary"
          _hover={{
            bg: 'primary',
            opacity: 0.4
          }}
          onClick={handleSubmit((values) => onFindHandler(values, pageIndex, pageSize))}>
          Find Transfer
        </Button>

      </Flex>

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
            {rows.map((row) => {
              prepareRow(row);
              return (
                <Tr
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ bg: 'muted.50' }}
                  {...row.getRowProps()}
                  onClick={() => onTrClickHandler(row.original.transferId)}>
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
              isDisabled={pageIndex === 1}
              onClick={() => {
                setPageIndex(1);
                handleSubmit((values) => onFindHandler(values, 1, pageSize))();
              }}
            />
            <IconButton
              aria-label="Go Previous"
              variant="ghost"
              icon={<TfiAngleLeft />}
              isDisabled={pageIndex === 1}
              onClick={() => {
                const newPage = pageIndex - 1;
                setPageIndex(newPage);
                handleSubmit((values) => onFindHandler(values, newPage, pageSize))();
              }}
            />
            <IconButton
              aria-label="Go Next"
              variant="ghost"
              icon={<TfiAngleRight />}
              isDisabled={pageIndex === totalPages}
              onClick={() => {
                const newPage = pageIndex + 1;
                setPageIndex(newPage);
                handleSubmit((values) => onFindHandler(values, newPage, pageSize))();
              }}
            />
            <IconButton
              aria-label="Skip to end"
              variant="ghost"
              icon={<TfiAngleDoubleRight />}
              isDisabled={pageIndex === totalPages}
              onClick={() => {
                setPageIndex(totalPages);
                handleSubmit((values) => onFindHandler(values, totalPages, pageSize))();
              }}
            />
          </HStack>
          <Text>
            Page{' '}
            <strong>
              {pageIndex} of {totalPages || 1}
            </strong>
          </Text>
          <Box h="6">
            <Divider orientation="vertical" />
          </Box>

          {/* Page size selector */}
          <HStack spacing={2}>
            <Text>Rows:</Text>
            <Select
              w="20"
              size="sm"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);       // <-- update pageSize state
                setPageIndex(1);            // reset to first page
                setPageNumber(1);         // update input
                handleSubmit(values => onFindHandler(values, 1, newSize))();
              }}
            >
              {[5, 10, 25, 50].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </Select>

          </HStack>

          <HStack>
            <Text> Go to page : </Text>
            <Input
              value={pageNumber ? Number(pageNumber) : ''}
              textAlign="center"
              w="14"
              type="number"
              min={1}
              max={totalPages}
              onChange={(e) => setPageNumber(Number(e.target.value))}
              onBlur={() => {
                let newPage = Number(pageNumber);
                if (!newPage || newPage < 1) newPage = 1;
                if (newPage > totalPages) newPage = totalPages;

                setPageIndex(newPage);
                setPageNumber(newPage);
                handleSubmit(values => onFindHandler(values, newPage, pageSize))();
              }}
            />
          </HStack>
        </HStack>
      </TableContainer>
    </Flex>
  );
};

export default memo(Transfer);
