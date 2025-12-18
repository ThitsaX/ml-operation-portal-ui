import { useState, useEffect, memo, useMemo, lazy, Suspense } from 'react';
import {
  Flex,
  Heading,
  Input,
  Button,
  Box,
  FormControl,
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
  Stack,
  SimpleGrid,
  IconButton,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransferHelper } from '@helpers/form';
import { omitBy, isEmpty } from 'lodash-es';
import { useGetUserState } from '@store/hooks';
import { useLoadingContext } from '@contexts/hooks';
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';
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
import { useSortBy, SortByFn, useTable, Column } from 'react-table';
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
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { PAGE_SIZE_OPTIONS } from '@utils/constants';
import { formatNumberWithCommas } from '@utils';

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

  // Pagination
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

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
    fromDate: moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm:ss'),
    toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'),
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
          from = moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss');
          break;
        case 'today':
          from = moment().tz(selectedTZString).startOf('d').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).endOf('d').format('YYYY-MM-DDTHH:mm:ss');
          break;
        case 'twoDay':
          from = moment().tz(selectedTZString).subtract(2, 'd').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss');
          break;
        case 'oneWeek':
          from = moment().tz(selectedTZString).subtract(1, 'w').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss');
          break;
        case 'oneMonth':
          from = moment().tz(selectedTZString).subtract(1, 'month').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss');
          break;
        case 'oneYear':
          from = moment().tz(selectedTZString).subtract(1, 'y').format('YYYY-MM-DDTHH:mm:ss');
          to = moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss');
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
    setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm:ss'), options)
    setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'), options)
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

    const requestValues = { ...values };
    if (requestValues.transferId && requestValues.transferId.trim() !== '') {
      const transferIdValue = requestValues.transferId.trim();

      // Reset all other search fields to empty
      Object.keys(requestValues).forEach(key => {
        if (key !== 'transferId' &&
            key !== 'fromDate' &&
            key !== 'toDate' &&
            key !== 'timezone') {
          (requestValues as any)[key] = '';
        }
      });
      requestValues.transferId = transferIdValue;
    }

    // Convert dates to UTC
    requestValues.fromDate = moment.tz(requestValues.fromDate, selectedTZString)
        .utc()
        .format();
    requestValues.toDate = moment.tz(requestValues.toDate, selectedTZString)
        .utc()
        .format();
    requestValues.timezone = timezone;

    start();
    getAllTransfers(omitBy(requestValues, isEmpty), currentPage, currentSize)
        .then((data) => {
          if (!data?.transferInfoList?.length) {
            toast({
              position: 'top',
              description: 'No data found',
              status: 'warning',
              isClosable: true,
              duration: 3000
            });
          }
          setTransferData(data.transferInfoList);
          setTotalPages(Math.ceil(data.totalPage / currentSize));
          setPageNumber(currentPage);
          setPageIndex(currentPage);
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
    [selectedTZString,complete, start, toast, pageIndex, pageSize]
  );

  const onCancelHandler = useCallback(() => {
    onSelectedTimezoneChange();
    if (!isHubUser) {
      onChangeTransferType('inbound');
    }
    onChangeDateRange('oneDay');

    setTotalPages(1);
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
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Transfer ID</Text>
        ),
        accessor: 'transferId',
        disableSortBy: true
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">State</Text>
        ),
        accessor: 'state'
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
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Amount</Text>
        ),
        accessor: 'amount',
        Cell: ({ value }) => (
          <Text textAlign="right">
            {formatNumberWithCommas(value)}
          </Text>
        ),
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Payer DFSP ID</Text>
        ),
        accessor: 'payerDfsp'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Payer DFSP Name</Text>
        ),
        accessor: 'payerDfspName',
        Cell: ({ value }) => (
        <Box maxW="200px"             
              whiteSpace="normal"
              wordBreak="break-word" 
              overflowWrap="break-word">
            {value}
        </Box>
      )
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Payee DFSP ID</Text>
        ),
        accessor: 'payeeDfsp'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Payee DFSP Name</Text>
        ),
        accessor: 'payeeDfspName',
        Cell: ({ value }) => (
        <Box maxW="200px"             
              whiteSpace="normal"
              wordBreak="break-word" 
              overflowWrap="break-word">
                {value}
        </Box>)
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Window ID</Text>
        ),
        accessor: 'windowId'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Settlement ID</Text>
        ),
        accessor: 'settlementBatch',
        Cell: ({ value }) => (
          <Text textAlign="right">
            {value}
          </Text>
        ),
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Submitted Date</Text>
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
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: transferData,
      manualPagination: true,
      pageCount: totalPages,
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


  const dateRangeOptions = [
    { value: 'oneDay', label: 'Past 24 Hours' },
    { value: 'today', label: 'Today' },
    { value: 'twoDay', label: 'Past 48 Hours' },
    { value: 'oneWeek', label: 'Past Week' },
    { value: 'oneMonth', label: 'Past Month' },
    { value: 'oneYear', label: 'Past Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const transferTypeOptions = [
    { value: 'inbound', label: 'Inbound' },
    { value: 'outbound', label: 'Outbound' },
  ];

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

      <VStack align="flex-start" w="full" h="full" py="2" px="1" mt={9}>
        <Heading fontSize="2xl" fontWeight="bold" mb={6}>Transfer Overview</Heading>
      </VStack>

      <Stack py="2" px="1" spacing={0} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 3, lg: 3 }}
          spacing={2}
          w="full"
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

          <FormControl isInvalid={!isEmpty(errors.transferStateId)}>
            <Controller
              control={control}
              name="transferStateId"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  maxMenuHeight={300}
                  isClearable={true}
                  placeholder="Transfer State"
                  options={tranStateRes?.data?.transferStateInfoList?.map((item) => ({
                    value: item.transferStateId,
                    label: item.transferState
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
            <FormErrorMessage>
              {errors?.transferStateId?.message}
            </FormErrorMessage>
          </FormControl>

          <Box display={{ base: "none", md: "block" }} />

          <CustomSelect
            placeholder="Date Range"
            options={dateRangeOptions}
            value={dateRangeOptions.find(option => option.value === dateRange) || null}
            onChange={(selectedOption) => {
              if (selectedOption) {
                onChangeDateRange(selectedOption.value as Ranges);
              }
            }}
          />

          <FormControl isInvalid={!isEmpty(errors.fromDate)} isRequired>
            {selectedTZString ?
              <Controller
                control={control}
                render={({ field: { value, onChange } }) => {
                  return (
                    <CustomDateTimePicker
                      disabled={dateRange !== 'custom' ? true : false}
                      value={value}
                      onChange={(event) => {
                        trigger('fromDate')
                        onChange(event.target.value);
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

          <FormControl isInvalid={!isEmpty(errors.toDate)} isRequired>
            {selectedTZString ?
              <Controller
                control={control}
                render={({ field: { value, onChange } }) => {
                  return (
                    <CustomDateTimePicker
                      disabled={dateRange !== 'custom' ? true : false}
                      value={value}
                      onChange={(event) => {
                        trigger('toDate')
                         onChange(event.target.value);
                      }}
                      borderWidth="1px"
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

          <CustomSelect
            isDisabled={isHubUser}
            placeholder="Transfer Type"
            options={transferTypeOptions.map(option => ({
              value: option.value,
              label: option.label
            }))}
            value={transferTypeOptions.find(option => option.value === transferType) || null}
            onChange={(selectedOption) => {
              if (selectedOption) {
                onChangeTransferType(selectedOption.value as TransferType);
              }
            }}
          />

          <FormControl isInvalid={!isEmpty(errors.currencyId)}>
            <Controller
              control={control}
              name="currencyId"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  maxMenuHeight={300}
                  isClearable={true}
                  placeholder="Select Currency"
                  options={currencyList?.map((item) => ({
                    value: item.currency,
                    label: item.currency
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>

          <Box display={{ base: "none", md: "block" }} />

          <FormControl isInvalid={!isEmpty(errors.payerFspId)}>
            {(isHubUser || transferType === 'inbound') ? (
              <Controller
                control={control}
                name="payerFspId"
                render={({ field }) => (
                  <CustomSelect placeholder="Payer FSP ID"
                    isMulti={false}
                    maxMenuHeight={300}
                    isClearable={true}
                    options={
                      participantRes?.data?.participantInfoList?.map((item) => ({
                        value: item.participantName,
                        label: item.description ? `${item.participantName} (${item.description})` : item.participantName
                      })) || []
                    }
                    value={
                      field.value
                      ?{
                          value : field.value,
                          label:(() => {
                            const p = participantRes?.data?.participantInfoList?.find(i => i.participantName === field.value);
                            return p ? p.description
                                  ? `${p.participantName} (${p.description})`
                                : p.participantName
                              : '';
                          })(),
                        }
                        : null
                    }
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value || '');
                    }}
                  />
                )}
              />
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

          <FormControl isInvalid={!isEmpty(errors.payerIdentifierTypeId)}>
            <Controller
              control={control}
              name="payerIdentifierTypeId"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  maxMenuHeight={300}
                  isClearable={true}
                  placeholder="Select Payer ID Type"
                  options={idTypeRes?.data?.idTypeInfoList?.map((item) => ({
                    value: item.partyIdentifierTypeId,
                    label: item.name
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
            <FormErrorMessage>
              {errors.payerIdentifierTypeId?.message}
            </FormErrorMessage>
          </FormControl>

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

          <FormControl isInvalid={!isEmpty(errors.payeeFspId)}>
            {isHubUser ? (
              <Controller
                control={control}
                name="payeeFspId"
                render={({ field }) => (
                  <CustomSelect
                    isMulti={false}
                    maxMenuHeight={300}
                    isClearable={true}
                    placeholder="Payee FSP ID"
                    options={
                      participantRes?.data?.participantInfoList?.map((item) => ({
                        value: item.participantName,
                        label: item.description ? `${item.participantName} (${item.description})` : item.participantName
                      })) || []
                    }
                    value={
                      field.value
                      ?{
                          value : field.value,
                          label:(() => {
                            const p = participantRes?.data?.participantInfoList?.find(i => i.participantName === field.value);
                            return p ? p.description
                                  ? `${p.participantName} (${p.description})`
                                : p.participantName
                              : '';
                          })(),
                        }
                        : null
                    }
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value || '');
                    }}
                  />
                )}
              />
            ) :
              transferType === 'inbound' ? (
                <Input
                  type="input"
                  {...register('payeeFspId')}
                  value={user.data?.participantName || ''}
                  readOnly
                />
              ) : (
                <Controller
                  control={control}
                  name="payeeFspId"
                  render={({ field }) => (
                    <CustomSelect
                      isMulti={false}
                      maxMenuHeight={300}
                      isClearable={true}
                      placeholder="Payee FSP ID"
                      options={
                        participantRes?.data?.participantInfoList?.map((item) => ({
                          value: item.participantName,
                          label: item.participantName
                        })) || []
                      }
                      value={
                        field.value
                          ? { value: field.value, label: field.value }
                          : null
                      }
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption?.value || '');
                      }}
                    />
                  )}
                />
              )}

            <FormErrorMessage>{errors.payeeFspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.payeeIdentifierTypeId)}>
            <Controller
              control={control}
              name="payeeIdentifierTypeId"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  maxMenuHeight={300}
                  isClearable={true}
                  placeholder="Select Payee ID Type"
                  options={idTypeRes?.data?.idTypeInfoList?.map((item) => ({
                    value: item.partyIdentifierTypeId,
                    label: item.name
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
            <FormErrorMessage>
              {errors.payeeIdentifierTypeId?.message}
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

        </SimpleGrid>
      </Stack>

      <Flex justify="flex-end" align="center" px={1} pt={4} pb={2} gap={4}>
        <Button onClick={onCancelHandler}>Clear Filter</Button>

        <Button
          color="white"
          bg="primary"
          _hover={{
            bg: 'primary',
            opacity: 0.4
          }}
          onClick={handleSubmit((values) => onFindHandler(values, 1, pageSize))}>
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
            <CustomSelect
              options={PAGE_SIZE_OPTIONS}
              value={PAGE_SIZE_OPTIONS.find(opt => opt.value === pageSize.toString()) || null}
              onChange={(selected) => {
                if (!selected) return;
                const newSize = Number(selected.value);
                setPageSize(newSize);
                setPageIndex(1);
                setPageNumber(1);
                handleSubmit(values => onFindHandler(values, 1, newSize))();
              }}
              maxMenuHeight={150}
              menuPortalTarget={true}
              menuPlacement='top'
            />

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
              onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      let newPage = Number(pageNumber);
                      if (!newPage || newPage < 1) newPage = 1;
                      if (newPage > totalPages) newPage = totalPages;

                      setPageIndex(newPage);
                      setPageNumber(newPage);
                      handleSubmit(values => onFindHandler(values, newPage, pageSize))();
                    }
                  }}
            />
          </HStack>
        </HStack>
    </Flex>
  );
};

export default memo(Transfer);