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
import Decimal from 'decimal.js';
import { MdWarningAmber } from "react-icons/md";

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

    const handleRefresh = async () => {
        try {
            setStringDateTime(handleTimeZone(stringTimezone));
            await syncHubParticipantsToPortal();
            await getPositionList();
            toast({
                title: 'Data refreshed',
                position: 'top',
                status: 'success',
                duration: 4000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error refreshing data',
                position: 'top',
                description: getErrorMessage(error as IApiErrorResponse) || 'Something went wrong. Please try again.',
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
                    accessor: 'description',
                    minWidth:250,
                    Cell: ({ value }: any) => (
                        <Text minWidth={260}
                                whiteSpace="normal"
                                wordBreak="break-word"
                                overflowWrap="break-word">
                            {value}
                        </Text>)
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
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => {
                        const balance = row.original.balance;
                        const displayBalance = balance === 0 ? balance : ((balance) * -1);
                        const showWarning = row.original.ndc > displayBalance;

                        return (
                            <HStack  justify="flex-end" spacing={2}>
                                { showWarning && (
                                    <Box 
                                        borderRadius="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        >
                                            <MdWarningAmber size={16} color="#FACC15" style={{ stroke: "black" }}/>
                                    </Box>)
                                }
                                <Box textAlign={'right'}>
                                    {formatNumberWithCommas(displayBalance)}
                                </Box>
                            </HStack>

                        );
                    }
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Current Position</Text>
                    ),
                    accessor: 'currentPosition',
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => {
                        const currentPosition = row.original.currentPosition;
                        const displayCurrentPosition = currentPosition === 0 ? currentPosition : ((currentPosition) * -1);
                        return (
                            <Box textAlign={'right'}>
                                {formatNumberWithCommas(displayCurrentPosition)}
                            </Box>
                        );
                    }
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
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => {
                        const balance = row.original.balance;
                        const displayBalance = balance === 0 ? balance : ((balance) * -1);
                        const showWarning = row.original.ndc > displayBalance;

                        return (   
                                <HStack  justify="flex-end" spacing={2}>
                                { showWarning && (
                                    <Box 
                                        borderRadius="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        >
                                            <MdWarningAmber size={16} color="#FACC15" style={{ stroke: "black" }}/>
                                    </Box>)
                                } 
                                <Text textAlign="right">
                                    {formatNumberWithCommas(row.original.ndc)}
                                </Text>
                            </HStack>
                        )
                    },
                },
                {
                    Header: () => (
                        <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">NDC Used %</Text>
                    ),
                    accessor: 'ndcUsed',
                    Cell: ({ row }: { row: Row<IParticipantPositionData> }) => {
                        const ndcUsed = row.original.ndcUsed;
                        const displayndcUsed = ndcUsed === 0 ? ndcUsed : ((ndcUsed) * -1);
                        return (
                            <HStack spacing={2} w="full" justifyContent="flex-end">
                                <Box
                                    w="10px"
                                    h="10px"
                                    borderRadius="full"
                                    bg={getValueColor(Number(displayndcUsed))}
                                />
                                <Box textAlign="right">
                                    <Text fontSize="sm">
                                        {displayndcUsed}%
                                    </Text>
                                </Box>
                            </HStack>
                            )
                    }
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
                title: `${actionLabel}`,
                position: 'top',
                description:
                    data.requestedAction === PositionActionType.UPDATE_NDC_PERCENTAGE
                        ? `Percentage: ${data.amount}% ${data.currency}`
                        : `Amount: ${data.amount} ${data.currency}`,
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

    const handleDeposit = (amountStr: string) => {
        const message = `Deposit request created and awaiting approval`;
        const amountDec = new Decimal(amountStr);
        const data: IApprovalRequest = {
            requestedAction: PositionActionType.DEPOSIT,
            participantName: selectedParticipant?.participantName || "",
            currency: selectedParticipant?.currency || "",
            settlementCurrencyId: selectedParticipant?.participantSettlementCurrencyId || 0,
            positionCurrencyId: selectedParticipant?.participantPositionCurrencyId || 0,
            amount:amountDec.toFixed(2),
        };
        approvalRequest(data, message, onDepositClose);
    };

    const handleWithdraw = (amountStr: string) => {
        
        if (!selectedParticipant) return;

        const message = `Withdraw request created and awaiting approval`;
        const amountDec = new Decimal(amountStr);
        const data: IApprovalRequest = {
            requestedAction: PositionActionType.WITHDRAW,
            participantName: selectedParticipant.participantName || "",
            currency: selectedParticipant.currency || "",
            settlementCurrencyId: selectedParticipant.participantSettlementCurrencyId || 0,
            positionCurrencyId: selectedParticipant.participantPositionCurrencyId || 0,
            amount: amountDec.toFixed(2),
        };
    
        const participantBalance = new Decimal(Math.abs(selectedParticipant.balance || 0));

        const remainingBalance = participantBalance.minus(amountDec).toDecimalPlaces(2, Decimal.ROUND_DOWN); 
        const rawCurrentPosition = new Decimal(selectedParticipant.currentPosition || 0).mul(-1);
        const absoluteCurrentPosition = rawCurrentPosition.abs();
        const rawPercent = selectedParticipant.ndcPercent;
        const ndcPercent = rawPercent && rawPercent !== "-" ? new Decimal(rawPercent.replace("%", "").trim()): null;
        const ndcAfterWithdraw = ndcPercent ? remainingBalance.mul(ndcPercent.div(100)).toDecimalPlaces(2, Decimal.ROUND_DOWN):null;

        const ndc = new Decimal(selectedParticipant.ndc || 0);

            if (amountDec.greaterThan(participantBalance)) {
                return showError(`Amount is invalid. Transaction amount cannot exceed the available balance.`);
            }

            if (!ndcPercent && remainingBalance.lessThan(ndc)) {
                return showError(`Amount is invalid. Balance after this transaction cannot be lower than the NDC.`);
            }

            if (rawCurrentPosition.isNegative() && remainingBalance.lessThan(absoluteCurrentPosition)) {
                return showError(`Amount is invalid. Balance after this transaction cannot be lower than the Current Position.`);
            }

            if(ndcPercent && rawCurrentPosition.isNegative() && ndcAfterWithdraw!.lessThan(absoluteCurrentPosition)){
                return showError(`Amount is invalid. This transaction amount results in NDC lower than the Current Position.`);
            }

            approvalRequest(data, message, onWithdrawClose);
    };

    const showError = (description: string) => {
        toast({
            title: 'Rejected Withdraw',
            description,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'top',
        });
    };

    const handleNetDebitCard = (type: 'fixed' | 'percentage', amountStr: string) => {
        const message = `NDC update request created and awaiting approval`;
        let amountDec = new Decimal(amountStr);
        const data: IApprovalRequest = {
            requestedAction:
                type === 'fixed'
                    ? PositionActionType.UPDATE_NDC_FIXED
                    : PositionActionType.UPDATE_NDC_PERCENTAGE,
            participantName: selectedParticipant?.participantName || "",
            currency: selectedParticipant?.currency || "",
            settlementCurrencyId: selectedParticipant?.participantSettlementCurrencyId || 0,
            positionCurrencyId: selectedParticipant?.participantPositionCurrencyId || 0,
            amount: amountDec.toFixed(2),
        };

        const participantBalance = Math.abs(selectedParticipant!.balance || 0);
        const rawCurrentPosition = new Decimal(selectedParticipant!.currentPosition || 0).mul(-1);
        const absoluteCurrentPosition = rawCurrentPosition.abs();
        const participantBalanceDec = new Decimal(participantBalance);
        amountDec = type === 'percentage' ? participantBalanceDec.mul(amountDec.div(100)).toDecimalPlaces(2, Decimal.ROUND_DOWN): amountDec ;
        if(rawCurrentPosition.isNegative() && amountDec.lessThan(absoluteCurrentPosition)){
            toast({
                title: 'Invalid NDC Amount',
                description: `NDC value cannot be lower than the Current Position.`,
                status: 'error',
                duration: 4000,
                isClosable: true,
                position: 'top',
            });
            return;
        }
        else if (type === 'fixed' && amountDec.greaterThan(participantBalance)) {
            toast({
            title: 'Invalid NDC Amount',
            description: `NDC value cannot exceed the participant’s Balance.`,
            status: 'error',
            duration: 4000,
            isClosable: true,
            position: 'top',
            });
            return;
        }
        
        approvalRequest(data, message, onNdcClose);
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
    
    useEffect(() => {
        setPageNumber(String(pageIndex + 1));
    }, [pageIndex]);

    return (

        <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
            <Heading fontSize="2xl" fontWeight="bold" mb={6}>Participant Positions</Heading>

            <HStack align="center">
                <Tooltip label='Refresh' bg='white' color='black'>
                    <IconButton
                        colorScheme="muted"
                        variant="ghost"
                        aria-label="Refresh data"
                        icon={<IoReload />}
                        onClick={handleRefresh}
                    />
                </Tooltip>

                <Text fontSize="sm" color="muted.700">
                    Last Updated at {`${stringDateTime} ${selectedTimezone.label}`}
                </Text>
            </HStack>

            <Box w="full">
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
            {/* Modals */}

            <DepositModal isOpen={isDepositOpen} onClose={onDepositClose} onSubmit={handleDeposit} />

            <WithdrawModal isOpen={isWithdrawOpen} onClose={onWithdrawClose} onSubmit={handleWithdraw} />

            <NetDebitCapModal isOpen={isNdcOpen} onClose={onNdcClose} onSubmit={handleNetDebitCard} />
        </VStack>
    );
};

export default ParticipantPositions;
