import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
  Stack,
  Divider,
  IconButton,
  Text,
  Icon,
  Select,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight,
} from 'react-icons/tfi';
import { AuditHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetAllAudit } from '@hooks/services';
import { IGetAuditByParticipantValues, IGetAuditByParticipant } from '@typescript/form';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  useGlobalFilter,
  useSortBy,
  useTable,
  Column,
} from 'react-table';
import { Controller, useForm } from 'react-hook-form';
import { isNumber, isEmpty } from 'lodash-es';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { FaSearch } from "react-icons/fa";
import GlobalFilter from '@components/interface/GlobalFilter';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';

const auditHelper = new AuditHelper();

const Audit = () => {
  const toast = useToast();
  const [tableData, setTableData] = useState<IGetAuditByParticipant[]>([]);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);


  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(() => selectedTimezone.value, [selectedTimezone]);

  /* React Query */

  const { data, mutateAsync } = useGetAllAudit();

  useEffect(() => {
    if (data?.auditInfoList) {
      setTableData(data.auditInfoList);
    }
  }, [data?.auditInfoList]);

  /* Form */
  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { isValid, errors },
  } = useForm<IGetAuditByParticipantValues>({
    defaultValues: {
      fromDate: moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'),
      toDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
    },
    resolver: zodResolver(auditHelper.schema),
    mode: 'onChange',
  });

  useEffect(() => {
    setValue('fromDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'));
    setValue('toDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));
  }, [selectedTZString, setValue]);

  const onSearchHandler = useCallback(
    async (values: IGetAuditByParticipantValues, page = 1, size = pageSize) => {
      const fromDate = moment.tz(values.fromDate, selectedTZString).utc().format();
      const toDate = moment.tz(values.toDate, selectedTZString).utc().format();
      const payload = { fromDate, toDate, page, pageSize: size };

      try {
        const response = await mutateAsync(payload);
        setTableData(response.auditInfoList || []);
        setTotalPages(response.totalPages || 1);
        setPageNumber(page);
        setPageSize(size);
      } catch (error: any) {
        const err = error as IApiErrorResponse;
        toast({
          position: 'top',
          description: getErrorMessage(err) || 'Failed to fetch data',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [mutateAsync, pageSize, selectedTZString, toast]
  );
  // Pagination + Search + Sort
  const columns = useMemo<Column<IGetAuditByParticipant>[]>(
    () => [
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Date</Text>
        ),
        accessor: 'date'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Action</Text>
        ),
        accessor: 'action'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="bold" fontSize="sm" textTransform="capitalize">Made By</Text>
        ), accessor: 'madeBy'
      },
    ],
    []
  );

  const {
    headerGroups,
    rows,
    prepareRow,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: tableData,
      manualPagination: true,
      pageCount: totalPages,
    },
    useGlobalFilter,
    useSortBy
  );

  return (
    <VStack
      align="flex-start"
      w="full"
      p="3"
      spacing={4}
      mt={10}
    >
      <Heading fontSize="2xl" mb={6}>Audit</Heading>

      {/* Search Filters */}
      <Stack
        direction={{ base: "column", md: "row" }}
        spacing={6}
        w="full"
      >
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.fromDate)} position="relative">
            <FormLabel>From</FormLabel>
            <Controller
              control={control}
              name="fromDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  type="datetime-local"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("toDate");
                  }}
                />
              )}
            />
            <FormErrorMessage position="absolute" bottom="-20px">{errors.fromDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.toDate)} position="relative">
            <FormLabel>To</FormLabel>
            <Controller
              control={control}
              name="toDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  type="datetime-local"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("fromDate");
                  }}
                />
              )}
            />
            <FormErrorMessage position="absolute" bottom="-20px">{errors.toDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.fromDate)}
            display="flex"
            alignItems="flex-end"
          >
            <Button
              onClick={handleSubmit((values) => onSearchHandler(values, 1, pageSize))}
              isDisabled={!isValid}
              colorScheme="blue"
              gap="2"
              size="md"
              w={{ base: "full", md: "auto" }}
            >
              <FaSearch /> Search
            </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>


      <Stack w="full" align="flex-start" spacing={2}>
        <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

        {/* Table */}
        <TableContainer mt={2} w="full" borderWidth={1} borderColor="gray.100" rounded="lg">
          <Table variant="simple">
            <Thead bg="gray.100">
              {headerGroups.map((headerGroup) => (
                <Tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <Th
                      {...column.getHeaderProps(
                        column.disableSortBy ? undefined : column.getSortByToggleProps()
                      )}
                    >
                      <HStack align="center" spacing="2" flex={1}>
                        {column.render('Header')}
                        {!column.disableSortBy && (
                          <VStack display="inline-flex" align="center" spacing={0}>
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

            <Tbody>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <Tr fontSize="sm" cursor="pointer" _hover={{ bg: 'muted.50' }} {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <Td {...cell.getCellProps()}>
                        {isNumber(cell.value)
                          ? moment.unix(cell.value).tz(selectedTZString).format('DD/MM/YYYY hh:mm:ss A')
                          : cell.value}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          {/* Pagination */}
          <HStack px="6" py="2">
            <HStack flex={2}>
              <IconButton
                aria-label="Skip to start"
                variant="ghost"
                icon={<TfiAngleDoubleLeft />}
                onClick={() => onSearchHandler(getValues(), 1, pageSize)}
                isDisabled={pageNumber === 1}
              />
              <IconButton
                aria-label="Go Previous"
                variant="ghost"
                icon={<TfiAngleLeft />}
                onClick={() => onSearchHandler(getValues(), pageNumber - 1, pageSize)}
                isDisabled={pageNumber === 1}
              />
              <IconButton
                aria-label="Go Next"
                variant="ghost"
                icon={<TfiAngleRight />}
                onClick={() => onSearchHandler(getValues(), pageNumber + 1, pageSize)}
                isDisabled={pageNumber === totalPages}
              />
              <IconButton
                aria-label="Skip to end"
                variant="ghost"
                icon={<TfiAngleDoubleRight />}
                onClick={() => onSearchHandler(getValues(), totalPages, pageSize)}
                isDisabled={pageNumber === totalPages}
              />
            </HStack>

            <Text>
              Page <strong>{pageNumber}</strong> of <strong>{totalPages}</strong>
            </Text>

            <Box h="6"><Divider orientation="vertical" /></Box>
            {/* Rows per page */}
            <HStack spacing={2}>
              <Text>Rows:</Text>
              <Select
                value={pageSize}
                onChange={(e) => onSearchHandler(getValues(), 1, Number(e.target.value))}
                size="sm"
                w="20"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack>
              <Text>Go to page :</Text>
              <Input
                value={pageNumber ? Number(pageNumber) : ''}
                textAlign="center"
                w="14"
                type="number"
                min={1}
                onChange={(e) => setPageNumber(Number(e.target.value))}
                onBlur={() => {
                  if (pageNumber >= 1 && pageNumber <= totalPages) {
                    onSearchHandler(getValues(), pageNumber, pageSize);
                  } else {
                    setPageNumber(1);
                  }
                }}
                size="sm"
                max={totalPages}
              />
            </HStack>

          </HStack>
        </TableContainer>
      </Stack>
    </VStack>
  );
};

export default Audit;
