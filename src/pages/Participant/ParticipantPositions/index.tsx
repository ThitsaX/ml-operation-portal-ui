import {
    Box,
    Button,
    HStack,
    IconButton,
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
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Divider,
    Input,
    Icon,
    useToast,
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { IoReload, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { TfiAngleDoubleLeft, TfiAngleDoubleRight, TfiAngleLeft, TfiAngleRight } from 'react-icons/tfi';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePagination, useSortBy, useTable, Column, Row } from 'react-table';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { RootState } from '@store';
import { IApprovalRequest, IParticipantPositionData, PositionActionType } from '@typescript/services';
import type { ITimezoneOption } from 'react-timezone-select';
import DepositModal from '@components/interface/Participant';
import WithdrawModal from '@components/interface/Participant/WidthdrawModal';
import NetDebitCapModal from '@components/interface/Participant/NetDebitCardModal';
import { createApprovalRequest, updateParticipantStatus,
    syncHubParticipantsToPortal, getParticipantPositionList
 } from '@services/participant';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { formatNumberWithCommas } from '@utils';

const ParticipantPositions = () => {

    const [pageNumber, setPageNumber] = useState<String>('1');
    const [tableData, setTableData] = useState<IParticipantPositionData[]>([]);
    const toast = useToast();
    const [selectedParticipant, setSelectedParticipant] = useState<IParticipantPositionData | null>(null);
    const [participantPositionList, setParticipantPositionList] = useState<IParticipantPositionData[]>([]);
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

    // Hooks
    const navigate = useNavigate();
    const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
    const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
    const { isOpen: isNdcOpen, onOpen: onNdcOpen, onClose: onNdcClose } = useDisclosure();

    useEffect(() => {
        syncHubParticipantsToPortal();
        getPositionList();
    }, []);

    const getPositionList = async () => {
        try {
            const data = await getParticipantPositionList();
            setParticipantPositionList(data);
        } catch (error: any) {
            const err = error as IApiErrorResponse;
            toast({
                title: 'Failed to fetch participant positions',
                position: 'top',
                description: getErrorMessage(err as IApiErrorResponse) || 'Something went wrong. Please try again.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        setStringDateTime(handleTimeZone(stringTimezone))
    }, [selectedTimezone, stringTimezone])

    const getValueColor = (num: number): string => {
        if (num > 0) {
            return "green.500";
        }
        if (num <= -40) {
            return "red.500";
        }
        if (num < 0 && num > -40) {
            return "blue.500";
        }
        return "gray.500";
    };


    const columns = useMemo(
        () => {
            const baseColumns = [
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">DFSP ID</Text>
                    ),
                    accessor: 'participantName',
                    Cell: ({ row }: any) => (
                        <Box
                            textAlign={'center'}
                            color="blue.600"
                            fontWeight="bold"
                            cursor="pointer"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => handleClick(row.original.participantName, row.original.participantId)}
                        >
                            {row.original.participantName}
                        </Box>)
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">DFSP Name</Text>
                    ),
                    accessor: 'description'
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Currency</Text>
                    ),
                    accessor: 'currency',
                    Cell: ({ value }: any) => (
                        <Text textAlign="center">
                            {value}
                        </Text>
                    ),
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Balance</Text>
                    ),
                    accessor: 'balance',
                    Cell: ({ row }: any) => (
                        <Box textAlign={'right'}>
                            {formatNumberWithCommas(row.original.balance)}
                        </Box>
                    )
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Current Position</Text>
                    ),
                    accessor: 'currentPosition',
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => (
                        <Box textAlign={'right'}>
                            {formatNumberWithCommas(row.original.currentPosition)}
                        </Box>
                    )
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">NDC %</Text>
                    ),
                    accessor: 'ndcPercent',
                    Cell: ({ value }: any) => (
                        <Text textAlign="right">
                            {value}
                        </Text>
                    ),
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">NDC</Text>
                    ),
                    accessor: 'ndc',
                    Cell: ({ value }: any) => (
                        <Text textAlign="right">
                            {formatNumberWithCommas(value)}
                        </Text>
                    ),
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">NDC Used %</Text>
                    ),
                    accessor: 'ndcUsed',
                    Cell: ({ value }: any) => (
                        <HStack spacing={2} w="full" justifyContent="flex-end">
                            <Box
                                w="10px"
                                h="10px"
                                borderRadius="full"
                                bg={getValueColor(Number(value))}
                            />
                            <Box textAlign="right">
                                <Text fontSize="sm">
                                    {value}
                                </Text>
                            </Box>
                        </HStack>
                    ),
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Enable/Disable</Text>
                    ),
                    id: "isActive",
                    disableSortBy: true,
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => {
                        return (
                            <Box w="full" display="flex" justifyContent="center" alignItems="center">
                                <Switch
                                    colorScheme="green"
                                    size="sm"
                                    isDisabled={!hasActionPermission("UpdateParticipantStatus")}
                                    isChecked={row.original.isActive}
                                    onChange={(e) => toggleStatus(row.original)}
                                />
                            </Box>
                        );
                    }
                }];

            const actionColumn = hasActionPermission("CreateApprovalRequest") ? [{
                Header: () => (
                    <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Action</Text>
                ),
                id: "action",
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

                                onClick={() => {
                                    setSelectedParticipant(row.original);
                                    onDepositOpen();
                                }}
                            >
                                Deposit
                            </MenuItem>
                            <Divider my={1} />
                            <MenuItem
                                _hover={{ bg: "blue.50", fontWeight: "semibold" }}
                                onClick={() => {
                                    setSelectedParticipant(row.original);
                                    onWithdrawOpen();
                                }}
                            >
                                Withdraw
                            </MenuItem>
                            <Divider my={1} />
                            <MenuItem
                                _hover={{ bg: "blue.50", fontWeight: "semibold" }}
                                onClick={() => {
                                    setSelectedParticipant(row.original);
                                    onNdcOpen();
                                }}
                            >
                                Net Debit Cap
                            </MenuItem>
                        </MenuList>
                    </Menu>
                ),
            }] : [];

            return [...baseColumns, ...actionColumn];
        },
        []
    ) as Column<IParticipantPositionData>[];

    useEffect(() => {
        if (participantPositionList) {
            setTableData(participantPositionList);
        }
    }, [participantPositionList]);

    const handlePageValidation = (value: string) => {
        if (Number(value) > pageOptions.length) {
            setPageNumber(pageNumber)
        } else if (value.startsWith('0')) {
            setPageNumber('')
        } else {
            setPageNumber(value)
        }
    }

    const handleClick = (participantName: string, participantId: string) => {
        navigate(`/participant/position/${participantName}`, {
            state: { participantId },
        });
    };

    const approvalRequest = async (
        data: IApprovalRequest,
        actionLabel: string,
        onSuccess?: () => void
    ) => {
        try {
            const res = await createApprovalRequest(data);
            toast({
                title: `${actionLabel} request created`,
                position: 'top',
                description: `Amount: ${data.amount} ${data.currency}`,
                status: 'success',
                duration: 4000,
                isClosable: true,
            });

            if (onSuccess) onSuccess();
        } catch (err: any) {
            const error = err as IApiErrorResponse;
            toast({
                title: `Failed to ${actionLabel}`,
                position: 'top',
                description: getErrorMessage(error) || 'Something went wrong',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
    };

    const handleDeposit = (amount: number) => {
        const data: IApprovalRequest = {
            requestedAction: PositionActionType.DEPOSIT,
            participantName: selectedParticipant?.participantName || "",
            currency: selectedParticipant?.currency || "",
            currencyId: selectedParticipant?.participantSettlementCurrencyId || 0,
            amount,
        };
        approvalRequest(data, 'Deposit', onDepositClose);
    };

    const handleWithdraw = (amount: number) => {
        const data: IApprovalRequest = {
            requestedAction: PositionActionType.WITHDRAW,
            participantName: selectedParticipant?.participantName || "",
            currency: selectedParticipant?.currency || "",
            currencyId: selectedParticipant?.participantSettlementCurrencyId || 0,
            amount,
        };
    
        const participantBalance = Math.abs(selectedParticipant!.balance || 0);

        const remainingBalance = Number(participantBalance.toFixed(2)) - Number(amount.toFixed(2)); 
        
            if (selectedParticipant?.ndcPercent === "-" && Number(remainingBalance.toFixed(2)) < selectedParticipant.ndc) {
                toast({
                    title: 'Rejected Withdraw',
                    description: `The amount should not be greater than the NDC.`,
                    status: 'error',
                    duration: 4000,
                    isClosable: true,
                    position: 'top',
                });
                return;
            }
 
            else if (amount > participantBalance) {
                toast({
                    title: 'Rejected Withdraw',
                    description: `Insufficient Balance.`,
                    status: 'error',
                    duration: 4000,
                    isClosable: true,
                    position: 'top',
                    });
                return;
            }
            else approvalRequest(data, 'Withdraw', onWithdrawClose);
    };

    const handleNetDebitCard = (type: 'fixed' | 'percentage', amount: number) => {
        const data: IApprovalRequest = {
            requestedAction:
                type === 'fixed'
                    ? PositionActionType.UPDATE_NDC_FIXED
                    : PositionActionType.UPDATE_NDC_PERCENTAGE,
            participantName: selectedParticipant?.participantName || "",
            currency: selectedParticipant?.currency || "",
            currencyId: selectedParticipant?.participantSettlementCurrencyId || 0,
            amount,
        };

        const participantBalance = Math.abs(selectedParticipant!.balance || 0);

        if (type === 'fixed' && amount > participantBalance) {
            toast({
            title: 'Invalid NDC Amount',
            description: `Auto-rejected: NDC must be less than or equal to the balance.`,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'top',
            });
            return;
        }
        
        approvalRequest(data, 'Net Debit Cap Update', onNdcClose);
    };


    const toggleStatus = async (data: IParticipantPositionData) => {
        const values = {
            participantCurrencyId: data.participantPositionCurrencyId,
            participantName: data.participantName,
            activeStatus: data.isActive ? 'INACTIVE' : 'ACTIVE',
        };

        try {
            await updateParticipantStatus(values);
            toast({
                title: `Success`,
                position: 'top',
                description: `Participant status ${values.activeStatus} updated successfully`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            await getPositionList();
        } catch (error: any) {
            const err = error as IApiErrorResponse;
            toast({
                title: 'Error',
                position: 'top',
                description: getErrorMessage(err) || 'Failed to update status.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
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

        <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
            <Heading fontSize="2xl" fontWeight="bold" mb={6}>Participant Positions</Heading>

            <HStack align="center">
                <Tooltip label='Refresh' bg='white' color='black'>
                    <IconButton
                        colorScheme="muted"
                        variant="ghost"
                        aria-label="Edit Account"
                        icon={<IoReload />}
                        onClick={() => {
                            setStringDateTime(() => handleTimeZone(stringTimezone))
                            syncHubParticipantsToPortal();
                        }}
                    />
                </Tooltip>

                <Text fontSize="sm" color="muted.700">
                    Last Updated at {`${stringDateTime} ${selectedTimezone.label}`}
                </Text>
            </HStack>

            <VStack w="full" align="flex-start" spacing={2} >
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
                                        <Th px={3}
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
                                                py={2}
                                                px={3}>{cell.render('Cell')}</Td>
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
            {/* Modals */}

            <DepositModal isOpen={isDepositOpen} onClose={onDepositClose} onSubmit={handleDeposit} />

            <WithdrawModal isOpen={isWithdrawOpen} onClose={onWithdrawClose} onSubmit={handleWithdraw} />

            <NetDebitCapModal isOpen={isNdcOpen} onClose={onNdcClose} onSubmit={handleNetDebitCard} />
        </VStack>
    );
};

export default ParticipantPositions;
