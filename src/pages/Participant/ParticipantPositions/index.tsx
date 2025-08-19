import {
    Box,
    Button,
    HStack,
    IconButton,
    Select,
    Switch,
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
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Divider,
    Input,
    Icon
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetDashboard } from '@hooks/services';
import { IParticipantPositionData } from '@typescript/services';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import type { ITimezoneOption } from 'react-timezone-select';
import moment from 'moment';
import { IoReload } from 'react-icons/io5';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { usePagination, useSortBy, useTable, Column } from 'react-table';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

const netDebitCardList = [{
    label: 'Fixed',
    value: 'fixed',
},
{ label: 'Percentage', value: 'percentage' },
]

const ParticipantPositions = () => {

    const [pageNumber, setPageNumber] = useState<String>('1');

    // Redux
    const selectedTimezone = useSelector<RootState, ITimezoneOption>(
        (s) => s.app.selectedTimezone
    );

    // Date time string for latest update
    const stringTimezone = selectedTimezone.value;

    //Changing date time according to the timezone
    const handleTimeZone = useCallback((value: string) => {
        return moment
            .tz(value)
            .format('DD/MM/YYYY hh:mm:ss A')
    }, [stringTimezone])

    const [stringDateTime, setStringDateTime] = useState<String>(handleTimeZone(stringTimezone))

    useEffect(() => {
        setStringDateTime(handleTimeZone(stringTimezone))
    }, [selectedTimezone, stringTimezone])

    const navigate = useNavigate();
    const { data, isLoading, isError, error, refetch } = useGetDashboard();
    const [tableData, setTableData] = useState<IParticipantPositionData[]>([]);

    const [openRowIndex, setOpenRowIndex] = useState<number | null>(null);
    const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
    const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
    const { isOpen: isNdcOpen, onOpen: onNdcOpen, onClose: onNdcClose } = useDisclosure();


    const columns = useMemo(
        () => [
            {
                Header: 'DFSP ID',
                accessor: 'dfspId',
                Cell: ({ row }: any) => (
                    <Box
                        color="blue.600"
                        fontWeight="bold"
                        cursor="pointer"
                        _hover={{ textDecoration: 'underline' }}
                        onClick={() => handleClick(row.original.dfspName)}
                    >
                        {row.original.dfspName}
                    </Box>)
            },
            {
                Header: 'DFSP Name',
                accessor: 'dfspName'
            },
            {
                Header: 'Currency',
                accessor: 'currency'
            },
            {
                Header: 'Balance',
                accessor: 'balance',
                Cell: ({ row }: any) => (
                    <Box>
                        {row.original.balance?.toFixed(2)}
                    </Box>
                )
            },
            {
                Header: 'Current Position',
                accessor: 'currentPosition',
                Cell: ({ row }: any) => (
                    <Box>
                        {row.original.currentPosition?.toFixed(2)}
                    </Box>
                )
            },
            {
                id: 'ndcPercent',
                Header: 'NDC %',
                accessor: 'ndc',
            },
            {
                Header: 'NDC',
                accessor: 'ndc',
            },
            {
                Header: 'NDC Used %',
                accessor: 'ndcUsed',
            },
            {
                Header: 'Enable/Disable',
                disableSortBy: true,
                Cell: ({ row }: any) => {
                    const isEnabled = row.original.ndc > 0;
                    const id = row.original.id;

                    return (
                        <Switch
                            colorScheme="green"
                            isChecked={isEnabled}
                            onChange={(e) => toggleStatus(id, e.target.checked)}
                        />
                    );
                }
            },
            {
                Header: 'Action',
                disableSortBy: true,
                width: 180,
                minWidth: 200,
                Cell: ({ row }: any) => (
                    <Menu>
                        <MenuButton
                            as={Button}
                            colorScheme="blue"
                            size="sm"
                            rightIcon={<FiChevronDown />}
                            fontWeight="medium"
                            fontSize="sm"
                            px={4}
                            py={2}
                            mr={8}
                        >
                            UPDATE
                        </MenuButton>
                        <MenuList
                            border="1px solid"
                            borderColor="blue.200"
                            boxShadow="md"
                            borderRadius="md"
                            fontSize="sm"
                            fontWeight="medium"
                            minW="150px"
                        >
                            <MenuItem
                                _hover={{ bg: "blue.50", fontWeight: "semibold" }}
                                onClick={onDepositOpen}
                            >
                                Deposit
                            </MenuItem>
                            <Divider my={1} />
                            <MenuItem
                                _hover={{ bg: "blue.50", fontWeight: "semibold" }}
                                onClick={onWithdrawOpen}
                            >
                                Withdraw
                            </MenuItem>
                            <Divider my={1} />
                            <MenuItem
                                _hover={{ bg: "blue.50", fontWeight: "semibold" }}
                                onClick={onNdcOpen}
                            >
                                Net Debit Cap
                            </MenuItem>
                        </MenuList>
                    </Menu>
                ),
            },
        ],
        []
    ) as Column<IParticipantPositionData>[];

    useEffect(() => {
        if (data) {
            setTableData(data);
        }
    }, [data]);

    const handlePageValidation = (value: string) => {
        if (Number(value) > pageOptions.length) {
            setPageNumber(pageNumber)
        } else if (value.startsWith('0')) {
            setPageNumber('')
        } else {
            setPageNumber(value)
        }
    }

    const toggleDropdown = (index: number) => {
        setOpenRowIndex(prev => (prev === index ? null : index));
    };

    const handleClick = (dfspId: string) => {
        navigate(`/participant/position/${dfspId}`);
    };

    const toggleStatus = (id: string | number, newValue: boolean) => {
        console.log('Toggle row id:', id, 'New status:', newValue);
    };

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
            data: tableData,
            initialState: {
                pageIndex: 0,
                pageSize: 10
            }
        },
        useSortBy,
        usePagination
    );

    return (
        <VStack align="flex-start" w="full" p={8} spacing={8}>
            <Heading size="md">Participant Positions</Heading>
            <HStack align="center">
                <Tooltip label='Refresh' bg='white' color='black'>
                    <IconButton
                        colorScheme="muted"
                        variant="ghost"
                        aria-label="Edit Account"
                        icon={<IoReload />}
                        onClick={() => {
                            setStringDateTime(() => handleTimeZone(stringTimezone))
                        }}
                    />
                </Tooltip>

                <Text fontSize="sm" color="muted.700">
                    Last Updated at {`${stringDateTime} ${selectedTimezone.label}`}
                </Text>
            </HStack>

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

            {/* Deposit Dialog */}
            <Modal isOpen={isDepositOpen} onClose={onDepositClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader textAlign="center">Deposit Funds</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box mb={4}>
                            <Text mb={2}>Amount</Text>
                            <Input placeholder='Enter Amount...' type='number' />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onDepositClose} mr={3} >Cancel</Button>
                        <Button colorScheme='blue' type='submit'>Submit</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Withdraw Dialog */}
            <Modal isOpen={isWithdrawOpen} onClose={onWithdrawClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader textAlign="center">Withdraw Funds</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box mb={4}>
                            <Text mb={2}>Enter Amount...</Text>
                            <Input placeholder='Enter Amount...' type='number' />
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onWithdrawClose} mr={3} >Cancel</Button>
                        <Button colorScheme='blue' type='submit'>Submit</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Net Debit Cap Dialog */}
            <Modal isOpen={isNdcOpen} onClose={onNdcClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader textAlign="center">Net Debit Cap</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box mb={4}>
                            <Select
                                mb={4}
                                name="currency"
                                placeholder="Choose Fixed/Percentage"
                                isRequired
                            >
                                {netDebitCardList?.map((item, index) => (
                                    <option key={index} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </Select>
                            <Box mb={4}>
                                <Text mb={2}>Fixed</Text>
                                <Input placeholder='Enter Amount...' type='number' />
                            </Box>
                            <Box mb={4}>
                                <Text mb={2}>Percentage</Text>
                                <Input placeholder='Enter Percentage...' type='number' />
                            </Box>
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" onClick={onNdcClose} mr={3} >Cancel</Button>
                        <Button colorScheme='blue' type="submit">Submit</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </VStack>
    );
};

export default ParticipantPositions;
