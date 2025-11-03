import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    Heading,
    HStack,
    Input,
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
    Modal,
    ModalBody,
    ModalOverlay,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ModalCloseButton,
    SimpleGrid,
} from '@chakra-ui/react';
import { FinalizeSettlementHelper } from '@helpers/form';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
    TfiAngleDoubleLeft,
    TfiAngleDoubleRight,
    TfiAngleLeft,
    TfiAngleRight,
} from 'react-icons/tfi';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IFinalizeSettlementForm } from '@typescript/form/settlements';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';

import { RootState } from '@store';
import { Ranges } from '@typescript/pages';
import { IFinalizeSettlement, INetTransferAmount } from '@typescript/services';
import { usePagination, useSortBy, useTable, Column } from 'react-table';
import { useGetParticipantCurrencyList } from '@hooks/services/participant';
import { 
    useGetSettlementStateList,
} from '@hooks/services/settlements';
import { 
    getFinalizeSettlementList,  
    finalizeSettlementWindow, 
    getNetTransferAmountBySettlement
} from '@services/settlements';
import { useLocation } from "react-router-dom";
import CustomSelect from '@components/interface/CustomSelect';
import { hasActionPermission } from '@helpers/permissions';
import { getErrorMessage } from '@helpers/errors';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const finalizeSettlementHelper = new FinalizeSettlementHelper();

const FinalizeSettlement = () => {

    const [dateRange, setDateRange] = useState<Ranges>('oneDay');
    const { start, complete } = useLoadingContext();
    const toast = useToast();

    const { data: currencyList } = useGetParticipantCurrencyList();
    const { data: stateList } = useGetSettlementStateList();

    const [pageNumber, setPageNumber] = useState<String>('1');
    const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const [selectedSettlement, setSelectedSettlement] = useState<IFinalizeSettlement | null>(null);
    const [netTransferAmount, setNetTransferAmount] = useState<INetTransferAmount | null>(null);

    const [finalizeSettlements, setFinalizeSettlements] = useState<IFinalizeSettlement[]>([]);

    const { state } = useLocation();


    const schema = finalizeSettlementHelper.schema;

    // Redux
    const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

    //Selected timezone offset
    const selectedTZString = selectedTimezone.value;
    // const timezone = selectedTimezone.offset === 0
    //     ? "0000"
    //     : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    const initialValues = {
        fromDate: moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm'),
        toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
        currency: '',
        state: ''
    }

    const onSearchHandler = (values: IFinalizeSettlementForm) => {
        const currentTimeZone = moment.tz.guess();

        // Convert the current timezone to UTC
        values.fromDate = moment(values.fromDate)
            .tz(selectedTZString ? selectedTZString : currentTimeZone)
            .utc()
            .set('second', 0)
            .format('YYYY-MM-DDTHH:mm:00');
        values.toDate = moment(values.toDate)
            .tz(selectedTZString ? selectedTZString : currentTimeZone)
            .utc()
            .set('second', 59)
            .format('YYYY-MM-DDTHH:mm:59');

        if (values.state === '') {
            delete values.state;
        }
        if (values.currency === '') {
            delete values.currency;
        }

        start();

        getFinalizeSettlementList(values)
            .then((data: IFinalizeSettlement[]) => {
                if (data.length === 0) {
                    toast({
                        position: 'top',
                        description: 'No data found',
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                }
                setFinalizeSettlements(data);
            })
            .catch((err) => {
                // Because mojaloop api returns 400 instead of 404
                // if no data found, we had to check for 400 for now
                if (err.error_code === '3100') {
                    toast({
                        position: 'top',
                        description: 'No data found',
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                    setFinalizeSettlements([]);
                } else {
                    toast({
                        position: 'top',
                        description: err.default_error_message || "Internal error",
                        status: 'error',
                        isClosable: true,
                        duration: 3000
                    });
                }
            })
            .finally(() => {
                complete();
            });
    };


    const onTrClickHandler = useCallback((settlement: IFinalizeSettlement) => {
        setSelectedSettlement(settlement);
        setNetTransferAmount(null);

        start();
        // Get settlement details
        getNetTransferAmountBySettlement(settlement.settlementId).then((data: INetTransferAmount) => {
            setNetTransferAmount(data);
        })
        .catch((err) => {
            toast({
                position: 'top',
                description: getErrorMessage(err) || 'Cannot retrieve net transfer amount',
                status: 'error',
                isClosable: true,
                duration: 3000
            });

            setNetTransferAmount(null);
        })
        .finally(() => {
            complete();
        });

        onDetailOpen();

    }, [start, toast, complete, onDetailOpen]);

    const handleFinalize = (settlement: IFinalizeSettlement) => {
        setSelectedSettlement(settlement);
        onFinalizeOpen();
    };

    const handleConfirmedFinalize = () => {
        if (!selectedSettlement) {
            return;
        }

        const data = { settlementId: selectedSettlement.settlementId };

        start();
        finalizeSettlementWindow(data).then((data) => {
            if (data.finalized) {
                toast({
                    position: 'top',
                    description: 'Settlement finalized successfully',
                    status: 'success',
                    isClosable: true,
                });
            }

            onSearchHandler(getValues());
        })
        .catch((err) => {
            toast({
                position: 'top',
                description: getErrorMessage(err) || 'Failed to finalize the settlement',
                status: 'error',
                isClosable: true,
                duration: 3000
            });
        })
        .finally(() => {
            complete();
            onFinalizeClose();
        });
    }

    const columns = useMemo<Column<IFinalizeSettlement>[]>(() => {
                const baseColumns: Column<IFinalizeSettlement>[] = [
        {
            Header: 'Settlement ID',
            accessor: 'settlementId',
            Cell: ({ row, value }: any) => (
                <Box
                    color="blue.600"
                    fontWeight="bold"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => onTrClickHandler(row.original)}
                >
                    {value}
                </Box>)
        },
        {
            Header: 'Window ID',
            accessor: 'settlementWindowList',
            Cell: ({ row }) => {
                const windows = row.original.settlementWindowList || [];
                return (
                    <Text>
                        {windows.map(w => w.settlementWindowId).join(', ')}
                    </Text>
                );
            },
        },
        {
            Header: 'State',
            accessor: 'state',
        },
        {
            Header: 'Settlement Created Date',
            accessor: 'createdDate',
            Cell: ({ value }) => (
                <Text>{moment(value).tz(selectedTZString).format('YYYY-MM-DD HH:mm')}</Text>
            ),
        },
        {
            Header: 'Settlement Finalize Date',
            accessor: 'changedDate',
            Cell: ({ value }) => (
                <Text>{moment(value).tz(selectedTZString).format('YYYY-MM-DD HH:mm')}</Text>
            )
        }];

            const actionColumn = hasActionPermission("FinalizeSettlement")
                            ? [
                                {
                                    Header: 'Action',
                                    id: 'action',
                                    disableSortBy: true,
                                    Cell: ({ row }: any) => {
                                        if (!['SETTLED', 'ABORTED'].includes(row.original.state)) {
                                            return (
                                                <HStack spacing={4}>
                                                    <Button
                                                        size="sm"
                                                        colorScheme="green"
                                                        variant="solid"
                                                        onClick={() => handleFinalize(row.original)}>
                                                        Finalize
                                                    </Button>
                                                </HStack>
                                            );
                                        }

                                        return <></>;
                                    }
                                } as Column<IFinalizeSettlement>,
                                ]
                            : []
        
            return [...baseColumns, ...actionColumn];
    }, [finalizeSettlements, selectedTZString]);
        

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
            data: finalizeSettlements,
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
        formState: { errors }
    } = useForm<IFinalizeSettlementForm>({
        resolver: zodResolver(schema),
        defaultValues: initialValues,
        mode: 'onChange'
    });

    useEffect(() => {
        // Auto search settlements if coming from settlement windows page
        if (state?.autoSearch) {
            onSearchHandler(getValues());
        }
    }, []);

    // const prepareToFspsOptions = (data: IGetAllOtherParticipant) => {
    //     const options: any[] = [{ value: 'all', label: 'All' }];
    //     data.participantInfoList.forEach((toFsp) => {
    //         options.push({ value: toFsp.dfsp_code, label: toFsp.dfsp_code });
    //     });
    //     setToFspOptions(options);
    //     setSelectedToFspOption(options[0]);
    // };

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
            }

            setDateRange(range);

            setValue('fromDate', from);
            setValue('toDate', to);
        },
        [setValue, selectedTimezone]
    );

    // const onSelectedTimezoneChange = useCallback(() => {
    //     reset()
    //     const options = { shouldValidate: true, shouldDirty: true }
    //     setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm'), options)
    //     setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'), options)
    // }, [selectedTimezone]);

    // Reseting values as soon as timezone change
    useEffect(() => {
        reset(initialValues)
        onChangeDateRange('oneDay');
        setFinalizeSettlements([]);
    }, [selectedTimezone])


    const onClearHandler = useCallback(() => {
        reset()
        onChangeDateRange('oneDay');
        // onSelectedTimezoneChange();
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
    const dateRangeOptions = [
        { value: 'oneDay', label: 'Past 24 Hours' },
        { value: 'today', label: 'Today' },
        { value: 'twoDay', label: 'Past 48 Hours' },
        { value: 'oneWeek', label: 'Past Week' },
        { value: 'oneMonth', label: 'Past Month' },
        { value: 'oneYear', label: 'Past Year' },
        { value: 'custom', label: 'Custom Range' },
    ];

    return (
        <VStack align="flex-start" h="full" p="3" mt={10} w="full">

                <Heading fontSize="2xl" fontWeight="bold" mb={6}>
                    Finalize Settlement
                </Heading>
            <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
                    <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={4} w="full">
                            <CustomSelect
                                options={dateRangeOptions}
                                 value={dateRangeOptions.find(option => option.value === dateRange)||null}
                                onChange={(selectedOption) => {
                                    if (selectedOption) {
                                        onChangeDateRange(selectedOption.value as Ranges);
                                    }
                                }}
                            />

                            <FormControl isInvalid={!isEmpty(errors.fromDate)} isRequired>
                                {/* <FormLabel fontSize="sm">Start Date</FormLabel> */}
                                {selectedTZString ?
                                    <Controller
                                        control={control}
                                        render={({ field: { value, onChange } }) => {
                                            return (
                                                <CustomDateTimePicker
                                                    disabled={dateRange !== 'custom' ? true : false}
                                                    value={value ? moment(value).format('YYYY-MM-DDTHH:mm') : initialValues.fromDate}
                                                    onChange={(event) => {
                                                        const date = moment(event.target.value, 'YYYY-MM-DDTHH:mm').toString()
                                                        trigger('fromDate')
                                                        onChange(date);
                                                    }}
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
                                {/* <FormLabel fontSize="sm">End Date</FormLabel> */}
                                {selectedTZString ?
                                    <Controller
                                        control={control}
                                        render={({ field: { value, onChange } }) => {
                                            return (
                                                <CustomDateTimePicker
                                                    disabled={dateRange !== 'custom' ? true : false}
                                                    value={value ? moment(value).format('YYYY-MM-DDTHH:mm') : initialValues.toDate}
                                                    onChange={(event) => {
                                                        const date = moment(event.target.value, 'YYYY-MM-DDTHH:mm').toString()
                                                        trigger('toDate')
                                                        onChange(date);
                                                    }}
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
                            <Box display={{ base: "none", md: "block" }}/>

                        <Controller
                            control={control}
                            name="state"
                            render={({ field }) => (
                                <CustomSelect
                                    placeholder="All States"
                                    isClearable={true}
                                    options={ 
                                        stateList?.map(({ settlementStateId, enumeration }) => ({
                                            value: settlementStateId,
                                            label: enumeration
                                        })) ?? []
                                    }
                                    value={field.value ? {
                                        value: field.value,
                                        label: field.value
                                    } : null}
                                    onChange={(selectedOption) => {
                                        field.onChange(selectedOption ? selectedOption.value : '');
                                    }}
                                />
                            )}
                        />

                            <Controller
                                control={control}
                                name="currency"
                                render={({ field }) => (
                                    <CustomSelect
                                        placeholder="All Currency"
                                        isClearable={true}
                                        options={
                                            currencyList?.map((item) => ({
                                                value: item.currency,
                                                label: item.currency,
                                            })) ?? []
                                        }
                                        value={field.value ? {
                                            value: field.value,
                                            label: field.value
                                        } : null}
                                        onChange={(selectedOption) => {
                                            field.onChange(selectedOption ? selectedOption.value : '');
                                        }}
                                    />
                                )}
                            />

                        <Box />
                        <Box display={{ base: "none", md: "block" }}/>
                        <Box display={{ base: "none", md: "block" }}/>
                        <Box display={{ base: "none", md: "block" }}/>
                        <Box display={{ base: "none", md: "block" }}/>
                       <FormControl display="flex" justifyContent={{ base: "stretch", md: "flex-end" }}alignItems="flex-end"
                            gap={5}
                            mb={1}
                        >
                            <Button fontSize="sm" minW="min-content" w={{ base: "100%" ,md:"50%"}} onClick={onClearHandler}>
                            Clear Filters
                        </Button>
                        <Button
                            color="white"
                            bg="primary"
                            w={{ base: "100%", md: "50%" }}
                            _hover={{
                                bg: 'primary',
                                opacity: 0.4
                            }}
                            onClick={handleSubmit(onSearchHandler)}>

                            Find
                        </Button>
                        </FormControl>
                      </SimpleGrid>
                </Stack>

            <VStack w="full" align="flex-start" spacing={2} >
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
                                                <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">{column.render('Header')}</Text>
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

            <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Finalize Settlement ID: <strong>{selectedSettlement?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Are you sure you want to proceed?
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFinalizeClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" onClick={handleConfirmedFinalize}>
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
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Settlement ID</Text>
                                    <Text fontSize="md">{selectedSettlement?.settlementId}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Window ID</Text>
                                    <Text fontSize="md">
                                        { 
                                            selectedSettlement?.settlementWindowList?.map((window) => window.settlementWindowId).join(', ')
                                        }
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Settlement State</Text>
                                    <Text fontSize="md">{selectedSettlement?.state}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Created Date</Text>
                                    <Text fontSize="md">
                                        {
                                            (
                                                selectedSettlement?.createdDate ? 
                                                moment(selectedSettlement.createdDate).tz(selectedTZString).format('YYYY-MM-DD HH:mm')
                                                :
                                                ""
                                            )
                                        }
                                    </Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Finalized Date</Text>
                                    <Text fontSize="md">
                                        {
                                            (
                                                selectedSettlement?.changedDate ? 
                                                moment(selectedSettlement.changedDate).tz(selectedTZString).format('YYYY-MM-DD HH:mm')
                                                :
                                                ""
                                            )
                                        }
                                    </Text>
                                </Box>
                            </SimpleGrid>


                            <TableContainer mt={4}>
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th py={3}>DFSP</Th>
                                            <Th py={3}>Currency</Th>
                                            <Th py={3} isNumeric>Debit</Th>
                                            <Th py={3} isNumeric>Credit</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {netTransferAmount?.details?.map((item: any, index: number) => (
                                            <Tr key={index}>
                                                <Td>{item.participantName}</Td>
                                                <Td>{item.currency}</Td>
                                                <Td isNumeric>{item.debitAmount == null ? '-' : item.debitAmount}</Td>
                                                <Td isNumeric>{item.creditAmount == null ? '-' : item.creditAmount}</Td>
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
       </VStack>
    );
};

export default memo(FinalizeSettlement);
