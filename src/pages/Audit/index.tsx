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
} from '@chakra-ui/react';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight,
} from 'react-icons/tfi';
import { useLoadingContext } from '@contexts/hooks';
import { getRequestErrorMessage } from '@helpers/errors';
import { AuditHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetAllAudit } from '@hooks/services';
import { useGetUserState } from '@store/hooks';
import { IGetAuditByParticipantValues, IGetAuditByParticipant } from '@typescript/form';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table';
import { Controller, useForm } from 'react-hook-form';
import { isNumber, isEmpty } from 'lodash-es';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { FaSearch } from "react-icons/fa";
import GlobalFilter from '@components/interface/GlobalFilter';

const auditHelper = new AuditHelper();

const Audit = () => {
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [tableData, setTableData] = useState<IGetAuditByParticipant[]>([]);
  const [pageNumber, setPageNumber] = useState<String>('1');

  /* Redux */
  const { data: user } = useGetUserState();

  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(() => selectedTimezone.value, [selectedTimezone]);

  /* React Query */

  const { data, mutateAsync } = useGetAllAudit();

  useEffect(() => {
    if (data) {
      setTableData(data);
    }
  }, [data]);

  /* Form */
  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    formState: { isValid, errors },
  } = useForm<IGetAuditByParticipantValues>({
    defaultValues: {
      fromDate: moment().format('YYYY-MM-DDTHH:mm'),
      toDate: moment().format('YYYY-MM-DDTHH:mm'),
    },
    resolver: zodResolver(auditHelper.schema),
    mode: 'onChange',
  });
  useEffect(() => {
        setValue('fromDate',  moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));
        setValue('toDate',   moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));

    }, [selectedTimezone, setValue]);
  const onSearchHandler = useCallback(
    (values: IGetAuditByParticipantValues) => {

      const currentTimeZone = moment.tz.guess();
      // Interpret input as selected timezone, then convert to UTC
      const fromDate = moment.tz(values.fromDate, selectedTZString || currentTimeZone)
        .utc()
        .format();

      const toDate = moment.tz(values.toDate, selectedTZString || currentTimeZone)
        .utc()
        .format();


      const payload = {
        fromDate,
        toDate,
      };

      start();
      mutateAsync(payload)
        .catch((err) => {
          toast({
            position: 'top',
            description: getRequestErrorMessage(err),
            status: 'error',
            isClosable: true,
            duration: 3000,
          });
        })
        .finally(() => complete());
    },
    [complete, mutateAsync, start, toast, user?.participantId, selectedTZString]
  );

  // Pagination + Search + Sort
  const columns = useMemo<
    { Header: string; accessor: keyof IGetAuditByParticipant }[]
  >(
    () => [
      { Header: 'DATE', accessor: 'date' },
      { Header: 'ACTION', accessor: 'action' },
      { Header: 'MADE BY', accessor: 'madeBy' },
    ],
    []
  );

  const {
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
    state: { pageIndex, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data: tableData,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

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
      <Heading fontSize="2xl" mb={6}>Audit</Heading>

{/* Search Filters */}
<Stack
  direction={{ base: "column", md: "row" }}  // column on mobile, row on desktop
  spacing={4}
  align="stretch"
  w="full"
>
  <FormControl isInvalid={!isEmpty(errors.fromDate)}>
    <FormLabel>From</FormLabel>
    <Controller
      control={control}
      name="fromDate"
      render={({ field: { value, onChange } }) => (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            onChange(e);
            trigger("fromDate");
          }}
        />
      )}
    />
    <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
  </FormControl>

  <FormControl isInvalid={!isEmpty(errors.toDate)}>
    <FormLabel>To</FormLabel>
    <Controller
      control={control}
      name="toDate"
      render={({ field: { value, onChange } }) => (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            onChange(e);
            trigger("toDate");
          }}
        />
      )}
    />
    <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
  </FormControl>

  <FormControl
    isInvalid={!isEmpty(errors.fromDate)}
    display="flex"
    alignItems="flex-end"
  >
    <Button
      onClick={handleSubmit(onSearchHandler)}
      isDisabled={!isValid}
      colorScheme="blue"
      gap="2"
      size="md"
      w={{ base: "full", md: "auto" }} // full width on mobile
    >
      <FaSearch /> Search
    </Button>
  </FormControl>
</Stack>


      <GlobalFilter globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

      {/* Table */}
      <TableContainer w="full" borderWidth={1} borderBottom={0} borderColor="gray.100" rounded="lg">
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
                      <Text flex={1}>{column.render('Header')}</Text>
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
            {page.map((row) => {
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
            Page <strong>{pageIndex + 1} of {pageOptions.length || 1}</strong>
          </Text>

          <Box h="6"><Divider orientation="vertical" /></Box>

          <HStack>
            <Text>Go to page :</Text>
            <Input
              value={pageNumber ? Number(pageNumber) : ''}
              textAlign="center"
              w="14"
              type="number"
              min={1}
              max={pageOptions.length}
              onChange={(e) => {
                handlePageValidation(e.target.value);
                const pageNum = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(pageNum);
              }}
            />
          </HStack>
        </HStack>
      </TableContainer>
    </VStack>
  );
};

export default Audit;
