import {
    Box,
    Button,
    HStack,
    IconButton,
    Input,
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
    Select as ChakraSelect,
    Icon,
    Divider,
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { usePagination, useSortBy, useTable, Row, Column } from 'react-table';
import { IGetUserData } from '@typescript/form';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
    TfiAngleDoubleLeft,
    TfiAngleDoubleRight,
    TfiAngleLeft,
    TfiAngleRight
} from 'react-icons/tfi';
import SettlementModal from '@components/interface/SettlementModels/SettlementModals';
import { ISettlementModel } from '@typescript/services';

// Sample data
const sampleSettlementWindow = [

    {
        "name": 'testuser1@gmail.com',
        "type": 'Test User One',
        "currencyId": 'DFSP - Admin',
    },
    {
        "name": 'testuser2@gmail.com',
        "type": 'Test User Two',
        "currencyId": 'DFSP - Operation',
    },
    {
        "name": 'testuser3@gmail.com',
        "type": 'Test User Three',
        "currencyId": 'HUB - Admin',
    },
    {
        "name": 'testuser4@gmail.com',
        "type": 'Test User Four',
        "currencyId": 'HUB - Manager',
    },
    {
        "name": 'testuser5@gmail.com',
        "type": 'Test User Five',
        "currencyId": 'HUB - User',
    },
    {
        "name": 'testuser1@gmail.com',
        "type": 'Test User One',
        "currencyId": 'DFSP - Admin',
    },
    {
        "name": 'testuser2@gmail.com',
        "type": 'Test User Two',
        "currencyId": 'DFSP - Operation',
    },
    {
        "name": 'testuser3@gmail.com',
        "type": 'Test User Three',
        "currencyId": 'HUB - Admin',
    },
    {
        "name": 'testuser4@gmail.com',
        "type": 'Test User Four',
        "currencyId": 'HUB - Manager',
    },
    {
        "name": 'testuser5@gmail.com',
        "type": 'Test User Five',
        "currencyId": 'HUB - User',
    },
    {
        "name": 'testuser1@gmail.com',
        "type": 'Test User One',
        "currencyId": 'DFSP - Admin',
    },
    {
        "name": 'testuser2@gmail.com',
        "type": 'Test User Two',
        "currencyId": 'DFSP - Operation',
    },
    {
        "name": 'testuser3@gmail.com',
        "type": 'Test User Three',
        "currencyId": 'HUB - Admin',
    },
    {
        "name": 'testuser4@gmail.com',
        "type": 'Test User Four',
        "currencyId": 'HUB - Manager',
    },
    {
        "name": 'testuser5@gmail.com',
        "type": 'Test User Five',
        "currencyId": 'HUB - User',
    }
];

const SettlementModels = () => {

    const [isOpen, setIsOpen] = useState(false);
    const [pageNumber, setPageNumber] = useState<String>('1');

    const toggleStatus = (id: string | number, newValue: boolean) => {
        // Example: Send update to API or update local state
        console.log('Toggle row id:', id, 'New status:', newValue);
        // ...your logic here
    };

    

    const columns = useMemo<Column<Partial<ISettlementModel>>[]>(() => [
            {
                Header: 'Model Name',
                accessor: 'name',
            },
            {
                Header: 'Model Type',
                accessor: 'type'
            },
            {
                Header: 'Currency',
                accessor: 'currencyId',
            },
            {
                Header: 'Action',
                disableSortBy: true,
                Cell: ({ row }: any) => (

                    <HStack spacing={3}>
                        <Button colorScheme="blue" size="md"
                            onClick={() => handleEditClick(row.original)}>
                            Edit
                        </Button>
                    </HStack>
                )
            }
        ],
        []
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
            data: sampleSettlementWindow,
            initialState: {
                pageIndex: 0,
                pageSize: 10
            }
        },
        useSortBy,
        usePagination
    );

    const handleEditClick = (user: any) => {
        setIsOpen(true);
    };

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
        <VStack w="full" align="flex-start" spacing={6} p={4}>
            <Heading size="lg">Settlement Models</Heading>

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

            <SettlementModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </VStack>
    );
};

export default SettlementModels;
