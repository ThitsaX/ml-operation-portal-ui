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
  Divider,
  IconButton,
  Text,
} from '@chakra-ui/react';
import {
  TfiAngleDoubleLeft,
  TfiAngleDoubleRight,
  TfiAngleLeft,
  TfiAngleRight
} from 'react-icons/tfi';
import { useLoadingContext } from '@contexts/hooks';
import { getRequestErrorMessage } from '@helpers/errors';
import { AuditHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetAllAuditByParticipant } from '@hooks/services';
import { useGetUserState } from '@store/hooks';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { IGetAuditByParticipant } from '@typescript/form';
import moment from 'moment';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { usePagination, useSortBy, useTable } from 'react-table';
import { Controller, useForm } from 'react-hook-form';
import { isNumber, isEmpty } from 'lodash-es';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';

const auditHelper = new AuditHelper();

const Audit = () => {
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [tableData, setTableData] = useState<IGetAuditByParticipant[]>([]);
  const [pageNumber, setPageNumber] = useState<String>('1')

  /* Redux */
  const { data: user } = useGetUserState();

  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  /* React Query */
  const { data, mutateAsync } = useGetAllAuditByParticipant();

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
    formState: { isValid, errors, defaultValues },
    getValues,
    reset
  } = useForm<IGetAuditByParticipantValues>({
    defaultValues: {
      participantId: user?.participant_id,
      from_date: moment().tz(selectedTZString).startOf('d').unix(),
      to_date: moment().tz(selectedTZString).endOf('d').unix()
    },
    resolver: zodResolver(auditHelper.schema),
    mode: 'onChange'
  });

  const onSearchHandler = useCallback(
    (values: IGetAuditByParticipantValues) => {
      start();
      mutateAsync(values)
        .catch((err) => {
          toast({
            position: 'top',
            description: getRequestErrorMessage(err),
            status: 'error',
            isClosable: true,
            duration: 3000
          });
        })
        .finally(() => complete());
    },
    [complete, mutateAsync, start, toast]
  );

  useEffect(() => {
    if (user) {
      onSearchHandler(getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const from_date = moment().tz(selectedTZString).startOf('d').unix();
    const to_date = moment().tz(selectedTZString).endOf('d').unix();
    if (
      from_date !== defaultValues?.from_date &&
      to_date !== defaultValues?.to_date
    ) {
      reset({
        ...defaultValues,
        from_date,
        to_date
      });

      // refresh the table
      onSearchHandler(getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTimezone]);

  // Pagination start here

  const columns = useMemo<
    { Header: string; accessor: keyof IGetAuditByParticipant }[]
  >(
    () => [
      {
        Header: 'DATE',
        accessor: 'action_date'
      },
      {
        Header: 'ACTION',
        accessor: 'action_name'
      },
      {
        Header: 'MADE BY',
        accessor: 'user_name'
      }
    ],
    []
  );

  const {
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

  const handlePageValidation = (value: string) => {
    if (Number(value) > pageOptions.length) {
      setPageNumber(pageNumber)
    }
    else if (value.startsWith('0')) {
      setPageNumber('')
    }
    else {
      setPageNumber(value)
    }
  }

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4}>
      <VStack align="flex-start">
        <Heading fontSize="3xl">Audit</Heading>
      </VStack>
      <VStack align="flex-start" alignSelf="stretch" spacing="3" maxW="500px">
        <HStack alignItems="flex-start" alignSelf="stretch">
          <FormControl isInvalid={!isEmpty(errors.from_date)}>
            <FormLabel>From</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <Input
                    type="date"
                    value={moment
                      .unix(value)
                      .tz(selectedTZString)
                      .format('YYYY-MM-DD')}
                    onChange={(event) => {
                      const date = moment(event.target.value, 'YYYY-MM-DD')
                        .startOf('day')
                        .unix();
                      onChange(date);
                      trigger('to_date');
                    }}
                  />
                );
              }}
              name="from_date"
            />
            <FormErrorMessage>{errors.from_date?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.to_date)}>
            <FormLabel>To</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <Input
                    type="date"
                    value={moment
                      .unix(value)
                      .tz(selectedTZString)
                      .format('YYYY-MM-DD')}
                    onChange={(event) => {
                      const date = moment(event.target.value, 'YYYY-MM-DD')
                        .endOf('day')
                        .unix();
                      onChange(date);
                      trigger('from_date');
                    }}
                  />
                );
              }}
              name="to_date"
            />
            <FormErrorMessage>{errors.to_date?.message}</FormErrorMessage>
          </FormControl>
        </HStack>
        <Box alignSelf="stretch">
          <Button
            colorScheme="brand"
            isDisabled={!isValid}
            onClick={handleSubmit(onSearchHandler)}>
            Search
          </Button>
        </Box>
      </VStack>
      <TableContainer
        w="full"
        borderWidth={1}
        borderBottom={0}
        borderColor="gray.100"
        rounded="lg">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Action</Th>
              <Th>Made By</Th>
            </Tr>
          </Thead>
          <Tbody>
            {page.map((row, index) => {
              prepareRow(row);
              return (
                <Tr
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ bg: 'muted.50' }}
                  {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <Td {...cell.getCellProps()}>
                      {isNumber(cell.value)
                        ? moment
                          .unix(cell.value)
                          .tz(selectedTZString)
                          .format('DD/MM/YYYY hh:mm:ss A')
                        : cell.value}
                    </Td>
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
  );
};

export default Audit;
