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
    ModalOverlay,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ModalCloseButton,
    SimpleGrid
} from '@chakra-ui/react';
import { FinalizeSettlementHelper } from '@helpers/form';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
    TfiAngleDoubleLeft,
    TfiAngleDoubleRight,
    TfiAngleLeft,
    TfiAngleRight,
} from 'react-icons/tfi';
import { RxCross2 } from "react-icons/rx";
import { IoCheckmark } from "react-icons/io5";
import { zodResolver } from '@hookform/resolvers/zod';
import { getAllOtherParticipants } from '@services/report';
import { useGetUserState } from '@store/hooks';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IGetAllOtherParticipant } from '@typescript/services';
import { IFinalizeSettlementForm } from '@typescript/form/settlements';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';

import { RootState } from '@store';
import { Ranges } from '@typescript/pages';
import { IFinalizeSettlement } from '@typescript/services';
import { usePagination, useSortBy, useTable, Row, Column } from 'react-table';
import { useGetCurrencyList } from '@hooks/services/participant';
import { getFinalizeSettlementList } from '@services/settlements';

const finalizeSettlementHelper = new FinalizeSettlementHelper();

const FinalizeSettlement = () => {

    const [dateRange, setDateRange] = useState<Ranges>('oneDay');
    const [stateList] = useState([{ value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]);
    const { start, complete } = useLoadingContext();
    const toast = useToast();

    const { data } = useGetCurrencyList();
    const user = useGetUserState();
    const [toFspOptions, setToFspOptions] = useState<any[]>([]);
    const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string }>();

    const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

    const [pageNumber, setPageNumber] = useState<String>('1');
    const { isOpen: isFinalizeOpen, onOpen: onFinalizeOpen, onClose: onFinalizeClose } = useDisclosure();
    const [selectedRow, setSelectedRow] = useState<any>(null);

    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
    const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

    const [finalizeSettlement, setFinalizeSettlement] = useState<IFinalizeSettlement[]>([]);


    const schema = finalizeSettlementHelper.schema;

    const search = useCallback(() => {
        start();

        const startDate = getValues().startDate;
        const endDate = getValues().endDate;
        const currency = getValues().currency;

        let utcStartDate = moment.utc(startDate).startOf('day').format();
        const utcEndDate = moment.utc(endDate).endOf('day').format();

        //Getting offset
        let tzOffSet: string = selectedTimezone.offset === 0
            ? "0000"
            : moment().tz(selectedTimezone.value).format('ZZ').replace('+', '');

        const data = {
            fromDate: utcStartDate,
            toDate: utcEndDate,
            currency: currency
        }
        getFinalizeSettlementList(data)
            .then((data: IFinalizeSettlement[]) => {
                console.log("Settlement window list", data);
                if (data.length === 0) {
                    toast({
                        position: 'top',
                        description: 'No data found',
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                }
                setFinalizeSettlement(data);
            })
            .finally(() => {
                complete();
            });
    }, [complete, start, toast, user]);

    const onFindHandler = useCallback(() => {
        search();
    },
        [search]
    );

    const onTrClickHandler = useCallback(
        (row: any) => {
            console.log("selected rows", row);
            setSelectedSettlement(row);
            onDetailOpen();
        },
        [onDetailOpen]
    );

    const handleFinalize = (row: any) => {
        setSelectedRow(row);
        onFinalizeOpen();
    };

    const columns = useMemo<Column<IFinalizeSettlement>[]>(() => [
        {
            Header: 'Settlement ID',
            accessor: 'id',
            Cell: ({ row }: any) => (
                <Box
                    color="blue.600"
                    fontWeight="bold"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline' }}
                    onClick={() => onTrClickHandler(row.original)}
                >
                    {row.original.settlementId}
                </Box>)
        },
        {
            Header: 'Window ID',
            accessor: 'id',
        },
        {
            Header: 'State',
            accessor: 'state',
        },
        {
            Header: 'Settlement Created Date',
            accessor: 'createdDate',
            Cell: ({ value }) => (
                <Text>{moment(value).format('YYYY-MM-DD HH:mm')}</Text>
            ),
        },
        {
            Header: 'Settlement Finalize Date',
            accessor: 'changedDate',
            Cell: ({ value }) => (
                <Text>{moment(value).format('YYYY-MM-DD HH:mm')}</Text>
            )
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
                        onClick={() => handleFinalize(row.original)}>
                        Finalize
                    </Button>
                </HStack>
            )

        },
    ], []);


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
            data: finalizeSettlement,
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
        formState: { errors, isValid }
    } = useForm<IFinalizeSettlementForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            startDate: moment().format('yyyy-MM-DD'),
            endDate: moment().format('yyyy-MM-DD'),
            currency: 'USD',
            state: 'pending'
        },
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

    const onClearHandler = () => {
        // reset({
        //     startDate: moment().format('yyyy-MM-DD'),
        //     endDate: moment().format('yyyy-MM-DD'),
        //     currency: 'USD',
        //     state: 'pending'
        // });
        setDateRange('oneDay');
        setSelectedToFspOption(toFspOptions[0]); // Reset to "All"
    };



    const onChangeDateRange = useCallback((range: Ranges) => {
        let from: string, to: string;
        const selectedTZString = selectedTimezone.value;

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
        setValue('startDate', from);
        setValue('endDate', to);
    }, [setValue, selectedTimezone]);

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
                    Finalize Settlement
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

                        <FormControl isInvalid={!isEmpty(errors.startDate)} isRequired>
                            {/* <FormLabel>Start Date</FormLabel> */}
                            <Controller
                                control={control}
                                name="startDate"
                                render={({ field }) => (
                                    <Input {...field} type="date" onChange={(e) => { field.onChange(e); trigger('endDate'); }} />
                                )}
                            />
                            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.endDate)} isRequired>
                            {/* <FormLabel>End Date</FormLabel> */}
                            <Controller
                                control={control}
                                name="endDate"
                                render={({ field }) => (
                                    <Input {...field} type="date" onChange={(e) => { field.onChange(e); trigger('startDate'); }} />
                                )}
                            />
                            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
                        </FormControl>

                    </HStack>
                    <HStack alignItems={'flex-start'} spacing={4}>
                        <FormControl width="400px">
                            <FormLabel>State</FormLabel>
                            <Controller
                                control={control}
                                name="state"
                                render={({ field }) => (
                                    <Select {...field}>
                                        {stateList.map((stateItem) => (
                                            <option key={stateItem.value} value={stateItem.value}>
                                                {stateItem.label}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>

                        <FormControl width="400px" isInvalid={!isEmpty(errors.currency)}>
                            <FormLabel>Currency</FormLabel>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select {...field} placeholder="Select Currency">
                                        {data?.map((item, index) => (
                                            <option key={index} value={item.currency}>
                                                {item.currency}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                            <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
                        </FormControl>
                    </HStack>
                    <HStack justifyContent='flex-end'>
                        <Button colorScheme='gray' variant='outline' onClick={onClearHandler}>
                            Clear Filters
                        </Button>
                        <Button colorScheme='blue' isDisabled={!isValid} onClick={onFindHandler}>
                            Find
                        </Button>
                    </HStack>
                </Stack>

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

            <Modal isOpen={isFinalizeOpen} onClose={onFinalizeClose} isCentered size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Finalize Settlement ID:<strong>{selectedRow?.settlementId}</strong></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        Are you sure you want to proceed?
                    </ModalBody>

                    <ModalFooter>
                        <Flex w="100%" justify="center" gap={4}>
                            <IconButton
                                aria-label="Finalize"
                                icon={<IoCheckmark size={24} />}
                                colorScheme="green"
                                borderRadius="full"
                                onClick={async () => {
                                    console.log('Finalizing Settlement ID:', selectedRow.transferId);
                                    // await finalizeSettlementAPI(selectedRow.transferId);
                                    onFinalizeClose();
                                }}
                            />

                            <IconButton
                                aria-label="Cancel"
                                icon={<RxCross2 size={24} />}
                                colorScheme="red"
                                borderRadius="full"
                                onClick={onFinalizeClose}
                            />
                        </Flex>
                    </ModalFooter>

                </ModalContent>
            </Modal >

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
                                    <Text fontSize="md">{selectedSettlement?.windowId?.join(',')}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Settlement State</Text>
                                    <Text fontSize="md">{selectedSettlement?.state}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Created Date</Text>
                                    <Text fontSize="md">{selectedSettlement?.settlementCreatedDate}</Text>
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color="gray.500">Finalized Date</Text>
                                    <Text fontSize="md">{selectedSettlement?.settlementFinalizeDate}</Text>
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


        </Box >
    );
};

export default memo(FinalizeSettlement);
