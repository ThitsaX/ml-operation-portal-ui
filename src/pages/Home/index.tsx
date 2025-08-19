import {
  Box,
  Heading,
  HStack,
  useToast,
  VStack,
  Text,
} from '@chakra-ui/react';
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
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { useGetAllAnnouncement } from '@hooks/services';

const auditHelper = new AuditHelper();

const Home = () => {
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [tableData, setTableData] = useState<IGetAuditByParticipant[]>([]);
  const [pageNumber, setPageNumber] = useState<String>('1')

  /* Redux */
  const { data: user } = useGetUserState();

  const { data: announcements = [] } = useGetAllAnnouncement();

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

  function changeDateMonthFormat(date: string) {
    return moment(date).format('MMM');
  }
  function changeDateDayFormat(date: string) {
    return moment(date).format('DD');
  }

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
      participantId: user?.participantId,
      fromDate: moment().tz(selectedTZString).startOf('d').unix(),
      toDate: moment().tz(selectedTZString).endOf('d').unix()
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
    const fromDate = moment().tz(selectedTZString).startOf('d').unix();
    const toDate = moment().tz(selectedTZString).endOf('d').unix();
    if (
      fromDate !== defaultValues?.fromDate &&
      toDate !== defaultValues?.toDate
    ) {
      reset({
        ...defaultValues,
        fromDate,
        toDate
      });

      onSearchHandler(getValues());
    }
  }, [selectedTimezone]);

  // Pagination start here

  const columns = useMemo<
    { Header: string; accessor: keyof IGetAuditByParticipant }[]
  >(
    () => [
      {
        Header: 'DATE',
        accessor: 'actionDate'
      },
      {
        Header: 'ACTION',
        accessor: 'actionName'
      },
      {
        Header: 'MADE BY',
        accessor: 'userName'
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
    <VStack align="flex-start" w="full" h="full" p="3" spacing={0}>
      <Heading fontSize="3xl" mb={4}>Home</Heading>

      <VStack
        align="flex-start"
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        px={4}
        py={3}
        mt={2}
        bg="gray.50"
        w="full"
        spacing={2}
        mb={8}
      >
        <Heading as="h2" fontSize="xl" color="black.200">
          Welcome to the Operation Portal!
        </Heading>
        <Text fontSize="md" color="gray.700">
          This is the main page of the portal. Use the navigation on the left to access different sections and perform various operations.
        </Text>
      </VStack>
      <Box h={8} /> {/* Spacer for margin between sections */}

      <Heading
        as="h3"
        fontSize="lg"
        mb={8}
        alignSelf="flex-start"
        color="black.600"
      >
        Latest Announcement
      </Heading>
      <Box h={2} />

      <VStack align="flex-start" bg="white" w="full" spacing={2} mb={8}>
        {announcements.map((announcement: any, index: number) => (
          <HStack
            key={index}
            borderRadius="md"
            p={4}
            border="1px"
            borderColor="gray.300"
            align="flex-start"
            spacing={4}
            w="full"
          >
            <Box
              minW="48px"
              textAlign="center"
              bg="gray.100"
              borderRadius="md"
              border="1px"
              borderColor="gray.300"
              p={1}
              mr={2}
            >
              <Text fontWeight="bold" fontSize="sm" color="black.600">
                {changeDateMonthFormat(announcement.date)}
              </Text>
              <Text fontSize="lg" color="gray.800" lineHeight="1">
                {changeDateDayFormat(announcement.date)}
              </Text>
            </Box>

            <VStack align="flex-start" spacing={1}>
              <Text fontWeight="bold" fontSize="md" color="gray.600">
                {announcement.title}
              </Text>
              <Box
                fontSize="sm"
                color="gray.700"
                dangerouslySetInnerHTML={{ __html: announcement.detail }}
              />
            </VStack>
          </HStack>
        ))}

      </VStack>
      {/* ...rest of your content... */}
    </VStack>
  );
};

export default Home;
