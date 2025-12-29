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
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ISettlementWindowForm, ISettlementWindowCreateForm } from '@typescript/form/settlements';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';

import { RootState } from '@store';
import { CustomSelect } from '@components/interface';
import { Ranges } from '@typescript/pages';
import { usePagination, useSortBy, useTable, Column } from 'react-table';
import { ISettlementWindow, INetTransferAmount, INetTransferDetail, ISettlementModel, ISettlementScheduler } from '@typescript/services';
import { getSettlementSchedulerList } from '@services/settlements';
import { getNextRunInfo, formatCountdown } from '@utils/schedule';

import {
    getSettlementWindowsList,
    getNetTransferAmountByWindow,
    createSettlementWindow
} from '@services/settlements';
// import { ISettlementWindows } from '@typescript/services';
import { useLoadingContext } from '@contexts/hooks';
import { Checkbox } from "@chakra-ui/react";
import { closeSettlementWindow } from "@services/settlements";

import { useGetParticipantCurrencyList } from '@hooks/services/participant';
import {
    useGetSettlementWindowStateList,
    useGetSettlementModelList,
} from '@hooks/services/settlements';
import { useNavigate } from "react-router-dom";
import { hasActionPermission } from '@helpers/permissions';
import { getErrorMessage } from '@helpers/errors';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const SettlementWindows = () => {
    const { start, complete } = useLoadingContext();
    const toast = useToast();
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

    const [dateRange, setDateRange] = useState<Ranges>('oneDay');
    const { data: currencyList } = useGetParticipantCurrencyList();
    const { data: stateList } = useGetSettlementWindowStateList();
    const { data: modelList } = useGetSettlementModelList({ refetchOnMount: 'always' });

    // const [toFspOptions, setToFspOptions] = useState<any[]>([]);
    // const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string }>();
    const [settlementModel, setSettlementModel] = useState<string>('');

    const [pageNumber, setPageNumber] = useState<String>('1');
    const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();
    const { isOpen: isMoveOnOpen, onOpen: onMoveOnOpen, onClose: onMoveOnClose } = useDisclosure();
    const [btnWinCloseDisabled, setBtnWinCloseDisabled] = useState<boolean>(false);
    const [btnCreateSettlementDisabled, setBtnCreateSettlementDisabled] = useState<boolean>(false);
    const [btnFindDisabled, setBtnFindDisabled] = useState<boolean>(false);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const [netTransferAmount, setNetTransferAmount] = useState<INetTransferAmount | null>(null);
    const [selectedWindow, setSelectedWindow] = useState<ISettlementWindow | null>(null);

    const settlementWindowHelper = new SettlementWindowHelper();
    const [settlementWindows, setSettlementWindows] = useState<ISettlementWindow[]>([]);

    const [nextUtc, setNextUtc] = useState<number | null>(null);
    const [countdownText, setCountdownText] = useState<string>('');
    const [countdownConfigured, setCountdownConfigured] = useState<boolean | null>(null);

    const navigate = useNavigate();


    const schema = settlementWindowHelper.schema;

    // Redux
    const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

    //Selected timezone offset
    const selectedTZString = selectedTimezone.value;
    // const timezone = selectedTimezone.offset === 0
    //     ? "0000"
    //     : moment().tz(selectedTZString).format('ZZ').replace('+', '');


    //Form initial values
    const initialValues = {
        fromDate: moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'),
        toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
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
    } = useForm<ISettlementWindowForm>({
        resolver: zodResolver(schema),
        defaultValues: initialValues,
        mode: 'onChange'
    });

      useEffect(() => {
        setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss'));
        setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'));
      }, [selectedTZString, setValue]);

    const onSearchHandler = (values: ISettlementWindowForm) => {
        const currentTimeZone = moment.tz.guess();

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
                    setSettlementWindows([]);
                } else {
                    toast({
                        position: 'top',
                        description: getErrorMessage(err) || "Internal error",
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
        }


    const onTrClickHandler = useCallback((window: ISettlementWindow) => {
        setSelectedWindow(window);
        setNetTransferAmount(null);

        start();
        // Get settlement details
        getNetTransferAmountByWindow(window.settlementWindowId).then((data: INetTransferAmount) => {
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


    const handleClose = (window: ISettlementWindow) => {
        setSelectedWindow(window);
        onFinalizeOpen();
    }


    const closeSettlement = () => {
        if (!selectedWindow) {
            return;
        }

        const data = {
            settlementWindowId: selectedWindow.settlementWindowId,
            state: 'CLOSED',
            reason: 'Business Operations Portal Request'
        }

        setBtnWinCloseDisabled(true);
        start();
        
        closeSettlementWindow(data).then(() => {
            toast({
                position: 'top',
                description: 'Settlement Window Closed Successfully',
                status: 'success',
                isClosable: true,
                duration: 3000
            });

            // Refresh the list after closing
            onSearchHandler(getValues());
        })
        .catch((err) => {
            toast({
                position: 'top',
                description: getErrorMessage(err) || 'Failed to close Settlement Window',
                status: 'error',
                isClosable: true,
                duration: 3000
            });
        })
        .finally(() => {
            complete();
            // Close the model
            onFinalizeClose();
            setBtnWinCloseDisabled(false);
        });
    };


    const createSettlement = () => {
        // Validate
        if (settlementModel === '') {
            return;
        }
        if (selectedRowIds.length < 1) {
            return;
        }

        const formData: ISettlementWindowCreateForm = {
            settlementModel: settlementModel,
            reason: "Create settlement via Operation Portal",
            settlementWindowIdList: selectedRowIds.map((id) => ({ id })),
        }

        setBtnCreateSettlementDisabled(true);
        start();

        createSettlementWindow(formData).then(() => {
            toast({
                position: 'top',
                description: 'Settlement Created Successfully',
                status: 'success',
                isClosable: true,
                duration: 3000
            });

            // Refresh the window list
            onSearchHandler(getValues());
        })
        .catch((err) => {
            toast({
                position: 'top',
                description: getErrorMessage(err) || 'Failed to create settlement',
                status: 'error',
                isClosable: true,
                duration: 3000
            });
        })
        .finally(() => {
            complete();
            setSettlementModel('');
            setSelectedRowIds([]);
            setBtnCreateSettlementDisabled(false);
            // Ask wheter to go to finalize settlement page
            onMoveOnOpen();
        });
    };


    const moveToSettlementFinalize = () => {
        navigate('../finalize-settlement', { state: { autoSearch: true } });
    };


    const columns = useMemo<Column<ISettlementWindow>[]>(() => {
            const baseColumns: Column<ISettlementWindow>[] = [
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
                const windowId = row.original.settlementWindowId;
                const isChecked = selectedRowIds.includes(windowId);

                if (row.original.state === 'CLOSED') {
                    return (
                        <Checkbox
                            isChecked={isChecked}
                            onClick={(e) => e.stopPropagation()} // ✅ prevent row click
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedRowIds((prev) => [...prev, windowId]);
                                } else {
                                    setSelectedRowIds((prev) => prev.filter((id) => id !== windowId));
                                }
                            }}
                        />
                    );
                }

                return <></>;
            },
        },

        {
            Header: 'Window ID',
            accessor: 'settlementWindowId',
            Cell: ({ row, value }: any) => (
                <Box
                    color="blue.600"
                    fontWeight="bold"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => onTrClickHandler(row.original)}
                >
                    { value }
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
                <Text>{moment(value).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}</Text>
            ),
        },
        {
            Header: 'Closed Date',
            accessor: 'closedDate',
            Cell: ({ row, value }) => {
                if (row.original.state === 'OPEN') return <></>;

                if (!value) return <Text></Text>;

                const m = moment(value);
                if (!m.isValid()) return <Text></Text>;

                return (
                  <Text>{m.tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}</Text>
                );
            },
        }];

        const actionColumn = hasActionPermission("CloseSettlementWindows")
                ? [
                    {
                        Header: 'Action',
                        id: 'action',
                        disableSortBy: true,
                        Cell: ({ row }: any) => {
                            let canCloseManual = true;
                            if (modelList && modelList.length > 0) {
                                canCloseManual = modelList[0].manualCloseWindow;
                            }

                            if (row.original.state === 'OPEN') {
                                return (
                                    <HStack spacing={4}>
                                        <Button
                                            isDisabled={!canCloseManual}
                                            title={ !canCloseManual ? "Disabled due to not allowing manual closing" : "" }
                                            size="sm"
                                            colorScheme="green"
                                            variant="solid"
                                            onClick={() => handleClose(row.original)}>
                                            Close Window
                                        </Button>
                                    </HStack>
                                );
                            }

                            return <></>;
                        }
                    } as Column<ISettlementWindow>,
                    ]
                : []

            return [...baseColumns, ...actionColumn];
        }, [settlementWindows, selectedRowIds, selectedTZString]);


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

    useEffect(() => {
        setPageNumber(String(pageIndex + 1));
    }, [pageIndex]);



    // useEffect(() => {
    //     getAllOtherParticipants(user, {
    //         participantId: user.data?.participantId
    //     }).then((data) => {
    //         prepareToFspsOptions(data);
    //     });
    // }, []);

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
    //     // setValue('timezoneOffset', timezone, options)
    // }, [selectedTimezone]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;

        const stop = () => {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const resetState = (configured: boolean | null) => {
            if (cancelled) return;
            setCountdownConfigured(configured);
            setCountdownText('');
            setNextUtc(null);
        };

        if (!modelList || modelList.length === 0) {
            stop();
            resetState(null);
            return () => {
                cancelled = true;
                stop();
            };
        }

        const isDeferredNetModel = (m: ISettlementModel) => {
            const t = (m.name || '').toString().toUpperCase();
            return t.includes('DEFERREDNET');
        };

        const deferredModels = modelList.filter(isDeferredNetModel);

        if (deferredModels.length === 0) {
            stop();
            resetState(null);
            return () => {
                cancelled = true;
                stop();
            };
        }

        const model: ISettlementModel =
            deferredModels.find((m: ISettlementModel) => m.autoCloseWindow) ?? deferredModels[0];

        if (!model.autoCloseWindow) {
            stop();
            resetState(false);
            return () => {
                cancelled = true;
                stop();
            };
        }

        (async () => {
            try {
                const resp = await getSettlementSchedulerList(model.settlementModelId);
                if (cancelled) return;

                const list: ISettlementScheduler[] = Array.isArray(resp?.settlementSchedulerList)
                    ? resp.settlementSchedulerList
                    : [];

                const crons = list
                    .filter(
                        (it) =>
                            !!it?.active &&
                            typeof it?.cronExpression === 'string' &&
                            it.cronExpression.trim().length > 0
                    )
                    .map((it) => String(it.cronExpression));

                if (!crons.length) {
                    stop();
                    resetState(false);
                    return;
                }

                const { nextUtc: initialNextUtc, countdown } = getNextRunInfo(
                    crons,
                    model.zoneId as string,
                    Date.now(),
                    model.autoCloseWindow
                );

                if (!initialNextUtc || cancelled) {
                    stop();
                    resetState(false);
                    return;
                }

                setCountdownConfigured(true);
                setNextUtc(initialNextUtc);
                setCountdownText(countdown);

                let currentNextUtc = initialNextUtc;

                stop();
                timer = setInterval(() => {
                    if (cancelled || !currentNextUtc) return;

                    const diff = currentNextUtc - Date.now();

                    if (diff <= 0) {
                        // the next countdown cronjob one
                        const { nextUtc: newNextUtc, countdown: newCountdown } = getNextRunInfo(
                            crons,
                            model.zoneId as string,
                            Date.now(),
                            model.autoCloseWindow
                        );

                        if (!newNextUtc) {
                            stop();
                            resetState(false);
                            return;
                        }

                        currentNextUtc = newNextUtc;
                        setNextUtc(newNextUtc);
                        setCountdownText(newCountdown);
                    } else {
                        setCountdownText(formatCountdown(diff));
                    }
                }, 1000);
            } catch {
                if (cancelled) return;
                stop();
                resetState(false);
            }
        })();

        return () => {
            cancelled = true;
            stop();
        };
    }, [modelList]);

    const onClearHandler = useCallback(() => {
        reset()
        onChangeDateRange('oneDay');
        setSettlementWindows([]);
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
            Settlement Windows
            </Heading>
             <Stack
                w="100%"
                my="4"
                gap={{ base: 4, md: 4 }}
                alignItems="stretch">
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
                                        stateList?.map((item) => ({
                                            value: item.settlementWindowStateId,
                                            label: item.enumeration,
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
                                        placeholder="All Currencies"
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
                            gap={2}
                            mb={1}
                        >
                          <Button fontSize="sm" minW="min-content" w={{ base: "100%", md: "50%"   }} onClick={onClearHandler}>
                            Clear Filters
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

                            Find
                        </Button>
                        </FormControl>
                    </SimpleGrid>
                </Stack>
                <Flex justify="space-between" align="center" flex={1} gap={5} mt={6}>
                    <Box>
                        {countdownConfigured === false && (
                            <Box
                                display="inline-flex"
                                alignItems="center"
                                px={4}
                                py={3}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                bg="gray.50"
                                color="gray.700"
                            >
                                <Text>
                                    <Text as="span" fontWeight="semibold">
                                        Countdown timer is not configured.
                                    </Text>{" "}
                                    Please contact the system administrator or check configuration settings.
                                </Text>
                            </Box>
                        )}

                        {countdownConfigured === true && (
                            <Box
                                display="inline-flex"
                                alignItems="center"
                                px={4}
                                py={3}
                                border="1px solid"
                                borderColor="green.200"
                                borderRadius="md"
                                bg="green.50"
                                color="green.800"
                            >
                                <Text fontWeight="semibold">
                                    Window will close in{" "}
                                    <Box as="span" color="green.700">
                                        {countdownText}
                                    </Box>
                                </Text>
                            </Box>
                        )}
                    </Box>

                    <HStack>
                        <CustomSelect
                            placeholder="Choose Settlement Model"
                            isClearable={true}
                            width={"16em"}
                            options={
                                modelList?.map((item) => ({
                                    value: item.name,
                                    label: item.name,
                                })) ?? []
                            }
                            value={
                                settlementModel
                                    ? {
                                        value: settlementModel,
                                        label: settlementModel,
                                    }
                                    : null
                            }
                            onChange={(selectedOption) => {
                                setSettlementModel(selectedOption ? selectedOption.value : "");
                            }}
                        />
                        {hasActionPermission("CreateSettlement") && (
                            <Button
                                isDisabled={settlementModel === "" || selectedRowIds.length < 1 || btnCreateSettlementDisabled}
                                color="white"
                                bg="primary"
                                _hover={{ bg: "primary", opacity: 0.4 }}
                                onClick={createSettlement}
                            >
                                Create Settlement
                            </Button>
                        )}
                    </HStack>
                </Flex>

                <Box w="full">
                <TableContainer
                    w="full"
                    borderWidth={1}
                    borderColor="gray.100"
                    rounded="lg"
                    mt="1">
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
                                               <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize" >{column.render('Header')}</Text>
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
                </Box>
            </Stack>

            <Modal isOpen={isMoveOnOpen} onClose={onMoveOnClose} isCentered>
                <ModalOverlay />
                <ModalContent paddingBottom={"1em"}>
                    <ModalHeader>Settlement(s) Submitted</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={3} flex={1}>
                            <Button w="100%" colorScheme="green" onClick={moveToSettlementFinalize}>
                                View Submitted Settlements
                            </Button>
                            <Button w="100%" colorScheme="red" onClick={onMoveOnClose}>
                                Continue Viewing Windows
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} closeOnOverlayClick={false} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Close Settlement Window ID: <strong>{selectedWindow?.settlementWindowId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Are you sure you want to proceed?
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onFinalizeClose}>
                            Cancel
                        </Button>
                        <Button colorScheme="green" isDisabled={btnWinCloseDisabled} onClick={closeSettlement}>
                            Yes, Close
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
                            <SimpleGrid
                                columns={{ base: 1, md: 2, lg: 4 }}
                                columnGap={{ base: 6, md: 8 }}
                                rowGap={{ base: 4, md: 6 }}
                                w="full"
                                textAlign="left"
                                pb={3}
                                borderBottomWidth="1px"
                                borderColor="gray.100"
                            >
                                <Flex direction="column" align="flex-start" justify="space-between" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        Window ID
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" isTruncated title={String(selectedWindow?.settlementWindowId ?? '—')}>
                                        {selectedWindow?.settlementWindowId ?? '—'}
                                    </Text>
                                </Flex>

                                <Flex direction="column" align="flex-start" justify="space-between" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        Window State
                                    </Text>
                                    <Text fontSize="xs" fontWeight="medium" isTruncated title={String(selectedWindow?.state ?? '—')}>
                                        {selectedWindow?.state ?? '—'}
                                    </Text>
                                </Flex>

                                <Flex direction="column" align="flex-start" justify="space-between" minH="56px" minW={0}>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        Window Open Date
                                    </Text>

                                    {selectedWindow?.createdDate ? (
                                        <Text
                                            fontSize="xs"
                                            fontWeight="medium"
                                            isTruncated
                                            title={moment(selectedWindow.createdDate).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}
                                        >
                                            {moment(selectedWindow.createdDate).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}
                                        </Text>
                                    ) : (
                                        <Text fontSize="xs" fontWeight="medium">
                                            —
                                        </Text>
                                    )}
                                </Flex>

                                <Flex
                                    direction="column"
                                    justify="space-between"
                                    minH="56px"
                                    minW={0}
                                    justifySelf={{ base: 'start', lg: 'end' }}
                                    align={{ base: 'flex-start', lg: 'flex-end' }}
                                    textAlign={{ base: 'left', lg: 'right' }}
                                >
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">
                                        Window Close Date
                                    </Text>

                                    {selectedWindow?.state !== 'OPEN' && selectedWindow?.closedDate ? (
                                        <Text
                                            fontSize="xs"
                                            fontWeight="medium"
                                            isTruncated
                                            title={moment(selectedWindow.closedDate).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}
                                        >
                                            {moment(selectedWindow.closedDate).tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ssZ')}
                                        </Text>
                                    ) : (
                                        <Text fontSize="xs" fontWeight="medium">
                                            —
                                        </Text>
                                    )}
                                </Flex>
                            </SimpleGrid>



                            <TableContainer mt={4} w='full'>
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
                                        {netTransferAmount?.details?.map((item: INetTransferDetail, index: number) => (
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

export default memo(SettlementWindows);
