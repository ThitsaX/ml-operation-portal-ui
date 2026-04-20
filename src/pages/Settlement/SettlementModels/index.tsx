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
    useToast,
    Stack
} from '@chakra-ui/react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    usePagination,
    useSortBy,
    useTable,
    Row,
    Column,
    CellProps
} from 'react-table';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import {
    TfiAngleDoubleLeft,
    TfiAngleDoubleRight,
    TfiAngleLeft,
    TfiAngleRight
} from 'react-icons/tfi';
import SettlementModal from '@components/interface/SettlementModels/SettlementModals';
import { ISettlementModel } from '@typescript/services';
import { getSettlementModelList } from '@services/settlements';
import { hasActionPermission } from '@helpers/permissions';
import { useTranslation } from 'react-i18next';

const SettlementModels = () => {
    const { t } = useTranslation();
    const [models, setModels] = useState<ISettlementModel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [settlementModelToEdit, setSettlementModelToEdit] = useState<ISettlementModel | undefined>(undefined);

    const [pageNumber, setPageNumber] = useState<string>('1');

    const toast = useToast();
    const handleEditClick = useCallback((rowItem: ISettlementModel) => {
        if (!rowItem) {
            toast({
                position: 'top',
                description: t('ui.settlement_model_not_found_or_missing_id'),
                status: 'warning',
                isClosable: true,
                duration: 3000
            });
            return;
            }
        setSettlementModelToEdit(rowItem);
        setIsOpen(true);
    }, [t, toast]);

    const applyModelPatch = (updated: ISettlementModel) => {
      setModels((prev) =>
        prev.map((m) =>
          m.settlementModelId === updated.settlementModelId ? { ...m, ...updated } : m
        )
      );
    };

    const toggleStatus = (id: string | number, newValue: boolean) => {
        // Example: Send update to API or update local state
        console.log('Toggle row id:', id, 'New status:', newValue);
        // ...your logic here
    };
    useEffect(() => {
        let ignore = false;

        const run = async () => {
            try {
                setLoading(true);
                const data = await getSettlementModelList();
                if (ignore) return;

                if (!data || data.length === 0) {
                    toast({
                        position: 'top',
                        description: t('ui.no_data_found'),
                        status: 'warning',
                        isClosable: true,
                        duration: 3000
                    });
                }
                setModels(data ?? []);
            } catch (e: any) {
                if (!ignore) {
                    console.error('[SettlementModels] fetch failed:', e);
                    setError(e?.message || t('ui.failed_to_load_settlement_models'));
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        run();
        return () => {
            ignore = true;
        };
    }, [t, toast]);

    const columns = useMemo<Column<ISettlementModel>[]>(() => {
        const baseColumns: Column<ISettlementModel>[] = [
            {
                Header: t('ui.model_name'),
                accessor: 'name'
            },
            {
                Header: t('ui.model_type'),
                accessor: 'type'
            },
            {
                Header: t('ui.currency'),
                accessor: 'currencyId',
                Cell: ({
                    value
                }: CellProps<ISettlementModel, string | undefined | null>) => (
                    <Text>{value ?? t('ui.not_available')}</Text>
                )
            },
        ];

        const actionColumn = hasActionPermission("ModifySettlementModel")
            ? [
                {
                    Header: t('ui.action'),
                    id: 'action',
                    disableSortBy: true,
                    Cell: ({ row }: { row: Row<ISettlementModel> }) => (
                        <HStack spacing={3}>
                            <Button colorScheme="blue" size="sm" onClick={() => handleEditClick(row.original)}>
                                {t('ui.edit')}
                            </Button>
                        </HStack>
                    ),
                } as Column<ISettlementModel>,
            ]
            : []

        return [...baseColumns, ...actionColumn];
    }, [handleEditClick, t]);

    const data = useMemo<ISettlementModel[]>(
        () => (models && models.length ? models : []),
        [models]
    );
    const initialState = useMemo(() => ({ pageIndex: 0, pageSize: 10 }), []);
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
            data,
            initialState
        },
        useSortBy,
        usePagination
    );

    useEffect(() => {
        setPageNumber(String(pageIndex + 1));
    }, [pageIndex]);

    const handlePageValidation = (value: string) => {
        if (Number(value) > pageOptions.length) {
            setPageNumber(pageNumber);
        } else if (value.startsWith('0')) {
            setPageNumber('');
        } else {
            setPageNumber(value);
        }
    };

    return (
        <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
            <Stack>
                <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.settlement_models')}</Heading>
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
                            {headerGroups.map((headerGroup) => {
                                const headerGroupProps = headerGroup.getHeaderGroupProps();
                                const { key: headerGroupKey, ...headerGroupRest } = headerGroupProps;

                                return (
                                    <Tr key={headerGroupKey} {...headerGroupRest}>
                                        {headerGroup.headers.map((column) => {
                                            const headerProps = column.getHeaderProps(
                                                column.disableSortBy
                                                    ? undefined
                                                    : column.getSortByToggleProps()
                                            );
                                            const { key: headerKey, ...headerRest } = headerProps;

                                            return (
                                                <Th
                                                    key={headerKey}
                                                    textTransform="none"
                                                    {...headerRest}>
                                                    <HStack
                                                        align="center"
                                                        spacing="2"
                                                        flex={1}>
                                                        <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">
                                                            {column.render('Header')}
                                                        </Text>
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
                                            );
                                        })}
                                    </Tr>
                                );
                            })}
                        </Thead>
                        <Tbody maxH={300} overflowY="auto" {...getTableBodyProps()}>
                            {page.map((row) => {
                                prepareRow(row);
                                const rowProps = row.getRowProps();
                                const { key: rowKey, ...rowRest } = rowProps;

                                return (
                                    <Tr
                                        key={rowKey}
                                        fontSize="sm"
                                        cursor="pointer"
                                        _hover={{ bg: 'muted.50' }}
                                        {...rowRest}
                                        >
                                        {row.cells.map((cell) => {
                                            const cellProps = cell.getCellProps();
                                            const { key: cellKey, ...cellRest } = cellProps;

                                            return (
                                                <Td key={cellKey} {...cellRest} py={2}>
                                                    {cell.render('Cell')}
                                                </Td>
                                            );
                                        })}
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
                                    handlePageValidation(e.target.value);
                                    const pageNumber = e.target.value
                                        ? Number(e.target.value) - 1
                                        : 0;
                                    gotoPage(pageNumber);
                                }}
                            />
                        </HStack>
                    </HStack>
            </Box>
            {settlementModelToEdit && (
                <SettlementModal 
                    settlementModel={settlementModelToEdit} 
                    isOpen={isOpen} 
                    onClose={() => {
                        setSettlementModelToEdit(undefined);
                        setIsOpen(false)
                    }} 
                    onUpdated={applyModelPatch}
                />
        )   }
        </VStack>
    );
};

export default SettlementModels;
