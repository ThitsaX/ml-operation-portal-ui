import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Input,
    Select,
    Stack,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    useDisclosure,
    Text,
    VStack,
    IconButton,
    Divider,
    Icon,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    ModalContent,
    SimpleGrid,
    ModalOverlay,
    ModalHeader
} from '@chakra-ui/react';
import { SettlementWindowHelper } from '@helpers/form';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
    TfiAngleDoubleLeft,
    TfiAngleDoubleRight,
    TfiAngleLeft,
    TfiAngleRight,
} from 'react-icons/tfi';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    getAllOtherParticipants
} from '@services/report';
import { useGetUserState } from '@store/hooks';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IGetAllOtherParticipant } from '@typescript/services';
import { ISettlementWindowForm } from '@typescript/form/settlements';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';

import { RootState } from '@store';
import { Ranges } from '@typescript/pages';
import { usePagination, useSortBy, useTable, Row, Column } from 'react-table';
import { ISettlementWindow } from '@typescript/services';

import { getSettlementWindowsList } from '@services/settlements';
import { ISettlementWindows } from '@typescript/services';
import { useLoadingContext } from '@contexts/hooks';
import { Checkbox } from "@chakra-ui/react";
import { closeSettlementWindow } from "@services/settlements";

const SettlementWindows = () => {
    const { start, complete } = useLoadingContext();
    const toast = useToast();
    const user = useGetUserState();
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);


    const [dateRange, setDateRange] = useState<Ranges>('oneDay');
    const [currencyList] = useState([{ value: 'USD', label: 'USD' }, { value: 'MMK', label: 'MMK' }, { value: 'EUR', label: 'EUR' }]);
    const [stateList] = useState([{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]);

    const [toFspOptions, setToFspOptions] = useState<any[]>([]);
    const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string }>();
    const [settlementModel, setSettlementModel] = useState<string>('');

    const [pageNumber, setPageNumber] = useState<String>('1');
    const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();
    const [selectedRow, setSelectedRow] = useState<any>(null);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

    const settlementWindowHelper = new SettlementWindowHelper();
    const [settlementWindows, setSettlementWindows] = useState<ISettlementWindow[]>([]);


    const schema = settlementWindowHelper.schema;

    // Redux
    const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

    //Selected timezone offset
    const selectedTZString = selectedTimezone.value;
    const timezone = selectedTimezone.offset === 0
        ? "0000"
        : moment().tz(selectedTZString).format('ZZ').replace('+', '');


    //Form initial values
    const initialValues = {
        fromDate: moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm'),
        toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
        currency: 'USD',
        state: 'pending'
    }


    const onSearchHandler = useCallback((values: any) => {
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

        getSettlementWindowsList(values)
            .then((data: ISettlementWindow[]) => {
                if (data.length === 0) {
                    toast({
                        position: 'top',
                        description: 'No data found',
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                }
                setSettlementWindows(data);
            })
            .finally(() => {
                complete();
            });
    }, [complete, start, toast, user]);


    const onTrClickHandler = useCallback(
        (row: any) => {
            setSelectedSettlement(row);
            onDetailOpen();
        },
        [onDetailOpen]
    );

    const handleClose = (row: any) => {
        setSelectedRow(row);
        onFinalizeOpen();
    }


    const closeSettlement = (row: any) => {
        const data = {
            settlementWindowId: selectedRow.settlementWindowId,
            state: 'CLOSED',
            reason: selectedRow.reason
        }
        closeSettlementWindow(data).then(() => {
            toast({
                position: 'top',

                description: 'Settlement Window Closed Successfully',
                status: 'success',
                isClosable: true,
                duration: 3000
            });
            onFinalizeClose();
            // Refresh the list after closing
            onSearchHandler(getValues());
        }
        ).catch(() => {

            toast({
                position: 'top',
                description: 'Failed to close Settlement Window',

                status: 'error',
                isClosable: true,
                duration: 3000
            });
            onFinalizeClose();
        });

    };

    const createSettlement = (model: string) => {
        console.log('Creating Settlement with Model:', model);
        // Do your API call / logic here
    };


    const columns = useMemo<Column<ISettlementWindow>[]>(() => [
        {
            id: "selection",
            Header: () => (
                <Checkbox
                    isChecked={
                        settlementWindows.length > 0 &&
                        selectedRowIds.length === settlementWindows.length
                    }
                    isIndeterminate={
                        selectedRowIds.length > 0 &&
                        selectedRowIds.length < settlementWindows.length
                    }
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedRowIds(settlementWindows.map((row) => row.settlementWindowId));
                        } else {
                            setSelectedRowIds([]);
                        }
                    }}
                />
            ),
            Cell: ({ row }: any) => {
                const rowId = row.original.settlementWindowId;
                const isChecked = selectedRowIds.includes(rowId);

                return (
                    <Checkbox
                        isChecked={isChecked}
                        onClick={(e) => e.stopPropagation()} // ✅ prevent row click
                        onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedRowIds((prev) => [...prev, rowId]);
                            } else {
                                setSelectedRowIds((prev) => prev.filter((id) => id !== rowId));
                            }
                        }}
                    />
                );
            },
        },

        {
            Header: 'Window ID',
            accessor: 'settlementWindowId',
            Cell: ({ row }: any) => (
                <Box
                    color="blue.600"
                    fontWeight="bold"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => onTrClickHandler(row.original)}
                >
                    {row.original.settlementWindowId}
                </Box>)
        },
        {
            Header: 'State',
            accessor: 'state',
        },
        {
            Header: 'Open Date',
            accessor: 'createdDate',
            Cell: ({ value }) => (
                <Text>{moment(value).format('YYYY-MM-DD HH:mm')}</Text>
            ),
        },
        {
            Header: 'Closed Date',
            accessor: 'changedDate',
            Cell: ({ value }) => (
                <Text>{moment(value).format('YYYY-MM-DD HH:mm')}</Text>
            ),
        },
        {
            Header: 'Action',
            disableSortBy: true,
            Cell: ({ row }: any) => (
                <HStack spacing={4}>
                    <Button
                        size="sm"
                        colorScheme="green"
                        variant="solid"
                        onClick={() => handleClose(row.original)}>
                        Close Window
                    </Button>
                </HStack>
            )

        },
    ],
        [settlementWindows, selectedRowIds]
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
            data: settlementWindows,
            initialState: {
                pageIndex: 0,
                pageSize: 10
            }
        },
        useSortBy,
        usePagination
    );


    const {
        control,
        getValues,
        setValue,
        trigger,
        reset,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<ISettlementWindowForm>({
        resolver: zodResolver(schema),
        defaultValues:
            initialValues,
        mode: 'onChange'
    });

    useEffect(() => {
        getAllOtherParticipants(user, {
            participantId: user.data?.participantId
        }).then((data) => {
            prepareToFspsOptions(data);
        });
    }, []);

    const prepareToFspsOptions = (data: IGetAllOtherParticipant) => {
        const options: any[] = [{ value: 'all', label: 'All' }];
        data.participantInfoList.forEach((toFsp) => {
            options.push({ value: toFsp.dfsp_code, label: toFsp.dfsp_code });
        });
        setToFspOptions(options);
        setSelectedToFspOption(options[0]);
    };

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
        setValue('timezoneOffset', timezone, options)
    }, [selectedTimezone]);

    // Reseting values as soon as timezone change
    useEffect(() => {
        reset(initialValues)
        onChangeDateRange('oneDay');
        setSettlementWindows([]);
    }, [selectedTimezone])


    const onCancelHandler = useCallback(() => {
        reset()
        onChangeDateRange('oneDay');
        onSelectedTimezoneChange();

        setSettlementWindows([]);
    }, [onChangeDateRange, reset, selectedTimezone]);


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
        <Box height='100vh'>
            <Box height="fit" p="4">
                <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" p="3">
                    Settlement Windows
                </Heading>
                <Stack borderWidth="1px" borderRadius="lg" height="full" p="4" spacing={4}>
                    <HStack alignItems={'flex-start'} spacing={4}>
                        <Select value={dateRange} onChange={(e) => onChangeDateRange(e.target.value as Ranges)}>
                            <option value="oneDay">Past 24 Hours</option>
                            <option value="today">Today</option>
                            <option value="twoDay">Past 48 Hours</option>
                            <option value="oneWeek">Past Week</option>
                            <option value="oneMonth">Past Month</option>
                            <option value="oneYear">Past Year</option>
                            <option value="custom">Custom Range</option>
                        </Select>

                        <FormControl isInvalid={!isEmpty(errors.fromDate)} isRequired>
                            {/* <FormLabel fontSize="sm">Start Date</FormLabel> */}
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
                                            />
                                        );
                                    }}
                                    name="fromDate"
                                /> : <p>Loading</p>}
                            <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={!isEmpty(errors.toDate)} isRequired>
                            {/* <FormLabel fontSize="sm">End Date</FormLabel> */}
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
                                            />
                                        );
                                    }}
                                    name="toDate"
                                />
                                : <p>Loading</p>}
                            <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
                        </FormControl>
                    </HStack>

                    <HStack alignItems={'flex-start'} spacing={4}>

                        <FormControl isRequired>
                            <Controller
                                control={control}
                                name="state"
                                render={({ field }) => (
                                    <Select {...field}>
                                        <option value="" disabled>
                                            Select State
                                        </option>
                                        {stateList.map((stateItem) => (
                                            <option key={stateItem.value} value={stateItem.value}>
                                                {stateItem.label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <Controller
                                control={control}
                                name="currency"
                                render={({ field }) => (
                                    <Select {...field}>
                                        <option value="" disabled>
                                            Select Currency
                                        </option>
                                        {currencyList.map((currency) => (
                                            <option key={currency.value} value={currency.value}>
                                                {currency.label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>


                    </HStack>

                    <HStack justifyContent='flex-end'>
                        <Button colorScheme='gray' variant='outline' onClick={onCancelHandler}>
                            Clear Filters
                        </Button>
                        <Button
                            color="white"
                            bg="primary"
                            _hover={{
                                bg: 'primary',
                                opacity: 0.4
                            }}
                            onClick={handleSubmit(onSearchHandler)}>

                            Find
                        </Button>
                    </HStack>
                </Stack>

                <Flex justify="flex-end" flex={1} gap={5} mt={6} >

                    <Select
                        placeholder="Choose Settlement Model"
                        value={settlementModel}
                        onChange={(e) => setSettlementModel(e.target.value)}
                        width="250px"
                    >
                        <option value="gross">Gross Settlement</option>
                        <option value="net">Net Settlement</option>
                        <option value="deferred">Deferred Settlement</option>
                        <option value="real-time">Real-Time Settlement</option>
                    </Select>
                    <Button
                        color="white"
                        bg="primary"
                        _hover={{
                            bg: 'primary',
                            opacity: 0.4
                        }}
                        onClick={() => createSettlement(settlementModel)}>
                        Create Settlement
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
                                        {...row.getRowProps()}>
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
            </Box>

            <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Finalize Settlement ID:<strong>{selectedRow?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Are you sure you want to proceed?
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFinalizeClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" onClick={closeSettlement}
                        >
                            Yes, Finalize
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="4xl" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Settlement Details</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={4}>
                            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={6} textAlign="center">
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Window ID</Text>
                                    <Text fontSize="md">{selectedSettlement?.windowId}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Window State</Text>
                                    <Text fontSize="md">{selectedSettlement?.state}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Window Open Date</Text>
                                    <Text fontSize="md">{selectedSettlement?.settlementCreatedDate}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Window Close Date</Text>
                                    <Text fontSize="md">{selectedSettlement?.settlementFinalizeDate}</Text>
                                </Box>
                            </SimpleGrid>


                            <TableContainer mt={4}>
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th>DFSP</Th>
                                            <Th>Currency</Th>
                                            <Th isNumeric>Debit</Th>
                                            <Th isNumeric>Credit</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {selectedSettlement?.details?.map((item: any, index: number) => (
                                            <Tr key={index}>
                                                <Td>{item.dfsp}</Td>
                                                <Td>{item.currency}</Td>
                                                <Td isNumeric>{item.debit || '-'}</Td>
                                                <Td isNumeric>{item.credit || '-'}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </ModalBody>

                    <ModalFooter>
                        <Button onClick={onDetailClose} variant="outline" colorScheme="blue">Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default memo(SettlementWindows);
