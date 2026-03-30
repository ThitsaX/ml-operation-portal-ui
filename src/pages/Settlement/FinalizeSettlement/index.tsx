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
    Flex,
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
import { useTranslation } from 'react-i18next';

const finalizeSettlementHelper = new FinalizeSettlementHelper();

type settlementValidationResult = {
    mode: number,
    dfsps: string[],
}

const FinalizeSettlement = () => {
    const { t } = useTranslation();

    const [dateRange, setDateRange] = useState<Ranges>('oneDay');
    const { start, complete } = useLoadingContext();
    const toast = useToast();

    const { data: currencyList } = useGetParticipantCurrencyList();
    const { data: stateList } = useGetSettlementStateList();

    const [pageNumber, setPageNumber] = useState<String>('1');
    const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();
    const { isOpen: isWarnOpen, onOpen: onWarnOpen, onClose: onWarnClose } = useDisclosure();
    const { isOpen: isErrorOpen, onOpen: onErrorOpen, onClose: onErrorClose } = useDisclosure();
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const [btnFindDisabled, setBtnFindDisabled ] = useState<boolean>(false);
    const [ btnDgFinalizeDisabled, setBtnDgFinalizeDisabled ] = useState<boolean>(false);

    const [selectedSettlement, setSelectedSettlement] = useState<IFinalizeSettlement | null>(null);
    const [netTransferAmount, setNetTransferAmount] = useState<INetTransferAmount | null>(null);
    const [warnDfsps, setWarnDfsps] = useState<string[]>([]);

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
        fromDate: moment().tz(selectedTZString).subtract(1, 'd').format('YYYY-MM-DDTHH:mm:ss'),
        toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'),
        currency: '',
        state: ''
    }
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
        setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss'));
        setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'));
    }, [selectedTZString, setValue]);

    const formatDateTime = useCallback((date?: string) => {
        if (!date) return '';
        return moment(date).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ');
    }, [selectedTZString]);

    const formatChangedDateOrBlank = useCallback((changedDate?: string, createdDate?: string) => {
        if (!changedDate) return '';
        if (!createdDate) return formatDateTime(changedDate);

        const changedUtcMs = moment.parseZone(changedDate).utc().valueOf();
        const createdUtcMs = moment.parseZone(createdDate).utc().valueOf();

        // If createdDate and changedDate are the same instant, show blank
        if (Number.isFinite(changedUtcMs) && Number.isFinite(createdUtcMs) && changedUtcMs === createdUtcMs) {
            return '';
        }

        return formatDateTime(changedDate);
    }, [formatDateTime]);

    const onSearchHandler = (values: IFinalizeSettlementForm) => {
        const currentTimeZone = moment.tz.guess();

        // Convert the current timezone to UTC
        values.fromDate = moment.tz(values.fromDate, selectedTZString ? selectedTZString: currentTimeZone ).utc().format();
        values.toDate = moment.tz(values.toDate, selectedTZString ? selectedTZString: currentTimeZone).utc().format();


        if (values.state === '') {
            delete values.state;
        }
        if (values.currency === '') {
            delete values.currency;
        }

        setBtnFindDisabled(true);
        start();

        getFinalizeSettlementList(values)
            .then((data: IFinalizeSettlement[]) => {
                if (data.length === 0) {
                    toast({
                        position: 'top',
                        description: t('ui.no_data_found'),
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
                        description: t('ui.no_data_found'),
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                    setFinalizeSettlements([]);
                } else {
                    toast({
                        position: 'top',
                        description: err.default_error_message || t('ui.internal_error'),
                        status: 'error',
                        isClosable: true,
                        duration: 3000
                    });
                }
            })
            .finally(() => {
                complete();
                setBtnFindDisabled(false);
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
                description: getErrorMessage(err) || t('ui.cannot_retrieve_net_transfer_amount'),
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
        setBtnDgFinalizeDisabled(false);
        onFinalizeOpen();
    };

    const validateFinalization = async (settlementId: string): Promise<settlementValidationResult | null> => {
        // We will return 0: ok, 1: error, 2: warning
        const result: settlementValidationResult = {
            mode: 0,
            dfsps: [],
        };

        // Validate by settlement's net transfer amount
        try {
            start();

            const data: INetTransferAmount = await getNetTransferAmountBySettlement(settlementId);

            if (!data.details.length) {
                return null;
            }

            for (const dfsp of data.details) {
                if (dfsp.creditAmount <= 0) {
                    continue;
                }

                if (dfsp.creditAmount > Math.abs(dfsp.participantBalance)) {
                    // Set the result mode to error and stop the loop
                    result.mode = 1;
                    result.dfsps = [dfsp.participantName];
                    break;
                } else if (dfsp.ndcPercent <= 0) {
                    // Only check if NDC is not percentage based
                    if (dfsp.participantLimit > (Math.abs(dfsp.participantBalance) - dfsp.creditAmount)) {
                        // Set the result mode to warning but keep going to find out more error/warnings
                        result.mode = 2;
                        result.dfsps.push(dfsp.participantName);
                    }
                }
            }

            return result;
        } catch(err: any) {
            toast({
                position: 'top',
                description: getErrorMessage(err) || t('ui.cannot_retrieve_net_transfer_amount'),
                status: 'error',
                isClosable: true,
                duration: 3000
            });

            return null;
        } finally {
            complete();
        }
    }

    const proceedWithFinalization = (settlementId: string) => {
        const data = { settlementId: settlementId };

        if (!btnDgFinalizeDisabled) setBtnDgFinalizeDisabled(true);
        start();

        finalizeSettlementWindow(data).then((data) => {
            if (data.finalized) {
                toast({
                    position: 'top',
                    description: t('ui.settlement_finalized_successfully'),
                    status: 'success',
                    isClosable: true,
                });
            }

            onSearchHandler(getValues());
        })
        .catch((err) => {
            toast({
                position: 'top',
                description: getErrorMessage(err) || t('ui.failed_to_finalize_the_settlement'),
                status: 'error',
                isClosable: true,
                duration: 3000
            });
        })
        .finally(() => {
            complete();
            if (isFinalizeOpen) onFinalizeClose();
            if (isWarnOpen) onWarnClose();
        });
    }

    const handleConfirmedFinalize = async () => {
        if (!selectedSettlement) {
            onFinalizeClose();
            return;
        }

        // Disable the finalize button to prevent multiple clicks
        setBtnDgFinalizeDisabled(true);

        // Validations before finalization
        const validateResult = await validateFinalization(selectedSettlement.settlementId);

        if (!validateResult) {
            onFinalizeClose();
            return;
        } else if (validateResult.mode === 1) {
            onFinalizeClose();
            setWarnDfsps(validateResult.dfsps);
            // Show a customized error message model
            onErrorOpen();
            return;
        } else if (validateResult.mode === 2) {
            onFinalizeClose();
            setWarnDfsps(validateResult.dfsps);
            setBtnDgFinalizeDisabled(false);
            // Open a warning dialogue to confirm proceed or not
            onWarnOpen();
            return;
        }

        proceedWithFinalization(selectedSettlement.settlementId);
    }

    const produceWarnDfsps = () => {
        return (
            <div>
                { warnDfsps.map((dfsp) => <Text fontSize="md" color="red">{dfsp}</Text>) }
            </div>
        );
    }

    const columns = useMemo<Column<IFinalizeSettlement>[]>(() => {
        const baseColumns: Column<IFinalizeSettlement>[] = [
            {
                Header: t('ui.settlement_id'),
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
                Header: t('ui.window_id'),
                accessor: 'settlementWindowList',
                Cell: ({ row }) => {
                    const windows = row.original.settlementWindowList || [];
                    const text = windows.map(w => w.settlementWindowId).join(', ');

                    return (
                        <Text
                            maxW="260px"
                            noOfLines={1}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={text}
                        >
                            {text}
                        </Text>
                    );
                },
            },

            {
                Header: t('ui.state'),
                accessor: 'state',
            },
            {
                Header: t('ui.settlement_created_date'),
                accessor: 'createdDate',
                Cell: ({ value }) => <Text>{formatDateTime(value)}</Text>,
            },
            {
                Header: t('ui.settlement_finalize_date'),
                accessor: 'changedDate',
                Cell: ({ row, value }: any) => (
                    <Text>{formatChangedDateOrBlank(value, row.original?.createdDate)}</Text>
                ),
            }];

        const actionColumn = hasActionPermission("FinalizeSettlement")
            ? [
                {
                    Header: t('ui.action'),
                    id: 'action',
                    disableSortBy: true,
                    Cell: ({ row }: any) => {
                        if (!['SETTLED', 'ABORTED'].includes(row.original.state)) {
                            return (
                                <HStack spacing={4}>
                                    <Button
                                        isDisabled={btnFindDisabled}
                                        size="sm"
                                        colorScheme="green"
                                        variant="solid"
                                        onClick={() => handleFinalize(row.original)}>
                                        {t('ui.finalize')}
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
    }, [finalizeSettlements, selectedTZString, btnFindDisabled, t]);


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

    useEffect(() => {
        setPageNumber(String(pageIndex + 1));
    }, [pageIndex]);

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
            }

            setDateRange(range);

            setValue('fromDate', from, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setValue('toDate', to, {
              shouldValidate: true,
              shouldDirty: true,
            });
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
        setFinalizeSettlements([]);
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
        { value: 'oneDay', label: t('ui.past_24_hours') },
        { value: 'today', label: t('ui.today') },
        { value: 'twoDay', label: t('ui.past_48_hours') },
        { value: 'oneWeek', label: t('ui.past_week') },
        { value: 'oneMonth', label: t('ui.past_month') },
        { value: 'oneYear', label: t('ui.past_year') },
        { value: 'custom', label: t('ui.custom_range') },
    ];

    return (
        <VStack align="flex-start" h="full" p="3" mt={10} w="full">

                <Heading fontSize="2xl" fontWeight="bold" mb={6}>
                    {t('ui.finalize_settlement')}
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

                            <FormControl isInvalid={!isEmpty(errors.fromDate)} isRequired>                                {selectedTZString ?
                                    <Controller
                                        control={control}
                                        render={({ field: { value, onChange } }) => {
                                            return (
                                                <CustomDateTimePicker
                                                    disabled={dateRange !== 'custom' ? true : false}
                                                    value={value}
                                                    onChange={(event) => {
                                                        onChange(event.target.value);
                                                        trigger('toDate');
                                                    }}
                                               _disabled={{
                                                cursor: 'not-allowed',
                                                opacity: 1
                                                }}
                                                />
                                            );
                                        }}
                                        name="fromDate"
                                    /> : <p>{t('ui.loading')}</p>}
                                <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
                            </FormControl>

                            <FormControl isInvalid={!isEmpty(errors.toDate)} isRequired>                                {selectedTZString ?
                                    <Controller
                                        control={control}
                                        render={({ field: { value, onChange } }) => {
                                            return (
                                                <CustomDateTimePicker
                                                    disabled={dateRange !== 'custom' ? true : false}
                                                    value={value}
                                                    onChange={(event) => {
                                                        onChange(event.target.value);
                                                        trigger('fromDate');
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
                                    : <p>{t('ui.loading')}</p>}
                                <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
                            </FormControl>
                            <Box display={{ base: "none", md: "block" }}/>

                        <Controller
                            control={control}
                            name="state"
                            render={({ field }) => (
                                <CustomSelect
                                    placeholder={t('ui.all_states')}
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
                                        placeholder={t('ui.all_currency')}
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
                            {t('ui.clear_filter')}
                        </Button>
                        <Button
                            isDisabled={btnFindDisabled}
                            color="white"
                            bg="primary"
                            w={{ base: "100%", md: "50%" }}
                            _hover={{
                                bg: 'primary',
                                opacity: 0.4
                            }}
                            onClick={handleSubmit(onSearchHandler)}>

                            {t('ui.search_button')}
                        </Button>
                        </FormControl>
                      </SimpleGrid>
                </Stack>

            <Box w="full">
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

            <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} closeOnOverlayClick={false} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{t('ui.finalize_settlement_id')} <strong>{selectedSettlement?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {t('ui.are_you_sure_you_want_to_finalize')}
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFinalizeClose}>
                            {t('ui.cancel')}
                        </Button>
                        <Button colorScheme="green" isDisabled={btnDgFinalizeDisabled} onClick={handleConfirmedFinalize}>
                            {t('ui.yes_finalize')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isWarnOpen} onClose={onWarnClose} closeOnOverlayClick={false} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{t('ui.proceed_with_settlement_id')} <strong>{selectedSettlement?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {t('ui.for_the_following_organizations')}
                        {produceWarnDfsps()}
                        {t('ui.this_settlement_will_result_in_their_balance_falling_below_the_ndc_value_do_you_wish_to_proceed')}
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onWarnClose}>
                            {t('ui.no')}
                        </Button>
                        <Button colorScheme="green" isDisabled={btnDgFinalizeDisabled} onClick={() => proceedWithFinalization(selectedSettlement?.settlementId || "")}>
                            {t('ui.yes_proceed')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isErrorOpen} onClose={onErrorClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{t('ui.finalize_settlement_id')} <strong>{selectedSettlement?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {t('ui.error')}:
                        {produceWarnDfsps()}
                        {t('ui.the_above_organization_does_not_have_sufficient_balance_to_perform_this_action')}
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="red" mr={3} onClick={onErrorClose}>
                            {t('ui.close')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="6xl" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{t('ui.settlement_details')}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={4}>
                            <SimpleGrid
                                columns={{ base: 1, md: 3, lg: 5 }}
                                columnGap={{ base: 6, md: 8 }}
                                rowGap={{ base: 4, md: 6 }}
                                w="full"
                                textAlign="left"
                                pb={3}
                                borderBottomWidth="1px"
                                borderColor="gray.100"
                            >
                                <Flex direction="column" align="flex-start" justify="flex-start" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        {t('ui.settlement_id')}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" isTruncated title={String(selectedSettlement?.settlementId ?? '—')}>
                                        {selectedSettlement?.settlementId ?? '—'}
                                    </Text>
                                </Flex>

                                <Flex direction="column" align="flex-start" justify="flex-start" minH="56px" minW={0} w="full">
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        {t('ui.window_id')}
                                    </Text>

                                    <Text
                                        fontSize="xs"
                                        fontWeight="medium"
                                        w="full"
                                        noOfLines={2}
                                        overflowWrap="anywhere"
                                        title={
                                            selectedSettlement?.settlementWindowList
                                                ? selectedSettlement.settlementWindowList.map((w) => w.settlementWindowId).join(', ')
                                                : '—'
                                        }
                                    >
                                        {selectedSettlement?.settlementWindowList?.map((w) => w.settlementWindowId).join(', ') ?? '—'}
                                    </Text>
                                </Flex>

                                <Flex direction="column" align="flex-start" justify="flex-start" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        {t('ui.settlement_state')}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" isTruncated title={String(selectedSettlement?.state ?? '—')}>
                                        {selectedSettlement?.state ?? '—'}
                                    </Text>
                                </Flex>

                                <Flex direction="column" align="flex-start" justify="flex-start" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        {t('ui.created_date')}
                                    </Text>
                                    <Text
                                        fontSize="xs"
                                        fontWeight="medium"
                                        isTruncated
                                        title={selectedSettlement?.createdDate ? formatDateTime(selectedSettlement.createdDate) : '—'}
                                    >
                                        {selectedSettlement?.createdDate ? formatDateTime(selectedSettlement.createdDate) : '—'}
                                    </Text>
                                </Flex>

                                <Flex
                                    direction="column"
                                    justify="flex-start"
                                    minH="56px"
                                    minW={0}
                                    justifySelf={{ base: 'start', lg: 'end' }}
                                    align={{ base: 'flex-start', lg: 'flex-end' }}
                                    textAlign={{ base: 'left', lg: 'right' }}
                                >
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        {t('ui.finalized_date')}
                                    </Text>
                                    <Text
                                        fontSize="xs"
                                        fontWeight="medium"
                                        isTruncated
                                        title={
                                            selectedSettlement?.changedDate
                                                ? formatChangedDateOrBlank(selectedSettlement.changedDate, selectedSettlement.createdDate)
                                                : '—'
                                        }
                                    >
                                        {selectedSettlement?.changedDate
                                            ? formatChangedDateOrBlank(selectedSettlement.changedDate, selectedSettlement.createdDate)
                                            : '—'}
                                    </Text>
                                </Flex>
                            </SimpleGrid>



                            <TableContainer mt={4} w='full'>
                                <Table variant="simple" size="sm">
                                    <Thead bg="gray.100">
                                        <Tr>
                                            <Th py={3}>{t('ui.dfsp')}</Th>
                                            <Th py={3}>{t('ui.currency')}</Th>
                                            <Th py={3} isNumeric>{t('ui.debit')}</Th>
                                            <Th py={3} isNumeric>{t('ui.credit')}</Th>
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
                        <Button onClick={onDetailClose} variant="outline" colorScheme="blue">{t('ui.close')}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
       </VStack>
    );
};

export default memo(FinalizeSettlement);
