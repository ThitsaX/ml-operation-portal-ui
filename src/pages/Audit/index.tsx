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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Spinner,
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
import { getAuditDetailById } from '@services/audit';
import { IGetAuditByParticipantValues } from '@typescript/form';
import { AuditInfo } from '@typescript/services';
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
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { JsonViewer } from '@components/interface/JsonViewer';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { useGetActionList, useGetMadeByList } from '@hooks/services';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const auditHelper = new AuditHelper();

const Audit = () => {
  const toast = useToast();
  const [tableData, setTableData] = useState<AuditInfo[]>([]);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [auditDetail, setAuditDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();


  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(() => selectedTimezone.value, [selectedTimezone]);

  /* React Query */

  const { data: userList } = useGetMadeByList();
  const { data: actionList } = useGetActionList();

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
      actionId: '',
      userId: '',
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
      const actionId = values.actionId;
      const userId = values.userId;

      const payload = { fromDate, toDate, actionId, userId, page, pageSize: size };

      try {
        const response = await mutateAsync(payload);
        if (!response?.auditInfoList?.length) {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000,
          });
        }
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

  const handleRowClick = async (auditId: string) => {
    setSelectedAuditId(auditId);
    setIsLoadingDetail(true);
    onDetailOpen();

    try {
      const detail = await getAuditDetailById(auditId);
      setAuditDetail(detail);
    } catch (error) {
      toast({
        position: 'top',
        description: getErrorMessage(error as IApiErrorResponse) || 'Failed to fetch audit details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    onDetailClose();
    setAuditDetail(null);
    setSelectedAuditId(null);
  };

  const getDisplayMadeBy = (madeBy?: string, action?: string) => {
    if (!madeBy || madeBy.trim() === '') {
      if (action && action.endsWith('Scheduler')) {
        return action.replace(/Scheduler$/, 'Automatically');
      }
      return '—';
    }
    return madeBy;
  };

  // Pagination + Search + Sort
  const columns = useMemo<Column<AuditInfo>[]>(
    () => [
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Date</Text>
        ),
        accessor: 'date'
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Action</Text>
        ),
        accessor: 'action',
      },
      {
        Header: () => (
          <Text flex={1} fontWeight="semibold" fontSize="sm" textTransform="capitalize">Made By</Text>
        ),
        accessor: 'madeBy',
        Cell: ({ row }: any) => {
          const { madeBy, action } = row.original;
          return <Text fontSize="sm">{getDisplayMadeBy(madeBy, action)}</Text>;
        },
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
      spacing={2}
      mt={10}
    >
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>Audit</Heading>

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
                <CustomDateTimePicker
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
                <CustomDateTimePicker
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

          <FormControl>
            <FormLabel>Action</FormLabel>
            <Controller
              control={control}
              name="actionId"
              render={({ field }) => (
                <CustomSelect
                  maxMenuHeight={300}
                  isClearable={true}
                  options={
                    (actionList ?? []).map((item) => ({
                      value: item.actionId,
                      label: item.actionName,
                    }))
                  }
                  value={
                    field.value
                      ? {
                        value: field.value,
                        label:
                          actionList?.find((a) => a.actionId === field.value)
                            ?.actionName || '',
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder="All"
                />
              )}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Made By</FormLabel>
            <Controller
              control={control}
              name="userId"
              render={({ field }) => (
                <CustomSelect
                  maxMenuHeight={300}
                  isClearable={true}
                  options={
                    (userList ?? []).map((item) => ({
                      value: item.userId,
                      label: item.email,
                    }))
                  }
                  value={
                    field.value
                      ? {
                        value: field.value,
                        label:
                          userList?.find((a) => a.userId === field.value)
                            ?.email || '',
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder="All"
                />
              )}
            />
          </FormControl>

          <Box display={{ base: "none", md: "block" }} />
          <Box display={{ base: "none", md: "block" }} />
          <Box display={{ base: "none", md: "block" }} />
          <FormControl
            isInvalid={!isEmpty(errors.fromDate)}
            display="flex"
            alignItems="flex-end"
            justifyContent={{ base: "stretch", md: "flex-end" }}
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
                  <Tr
                    fontSize="sm"
                    cursor="pointer"
                    _hover={{ bg: 'muted.50' }}
                    {...row.getRowProps()}
                    onClick={() => handleRowClick(row.original.auditId)}
                  >
                    
                    {row.cells.map((cell) => (
                      <Td {...cell.getCellProps()} py={2}>
                        {cell.column.id === 'action' || cell.column.id === 'madeBy'
                          ? cell.render('Cell')
                          : isNumber(cell.value)
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

      {/* Audit Detail Modal - Updated with beautified JSON display */}
      <Modal isOpen={isDetailOpen} onClose={handleCloseModal} size="3xl" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent
          w={{ base: "90%", md: "600px" }}
          minW={{ base: "auto", md: "600px" }}
          maxW="90%"
          mx="auto">
          <ModalHeader borderBottom="1px solid" borderColor="gray.200">
            Audit Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" minH="400px" overflowY="auto" bg="gray.50" p={6}>
            {isLoadingDetail ? (
              <Box
                h="400px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="100%"
              >
                <VStack spacing={4} align="center">
                  <Spinner size="xl" color="blue.500" />
                  <Text color="gray.600">Loading audit details...</Text>
                </VStack>
              </Box>
            ) : auditDetail ? (
              <VStack spacing={5} align="stretch">
                <Box
                  bg="white"
                  p={5}
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                    Request
                  </Text>
                  <JsonViewer value={auditDetail.inputInfo} />
                </Box>
                <Box
                  bg="white"
                  p={5}
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                    Response
                  </Text>
                  {auditDetail.outputInfo ? (<JsonViewer value={auditDetail.outputInfo} />)
                    : (<JsonViewer
                      value={{
                        exception: auditDetail.exceptionInfo
                      }}
                    />)
                  }
                </Box>
              </VStack>
            ) : (
              <Text color="gray.600" textAlign="center" py={8}>
                No details available
              </Text>
            )}
          </ModalBody>
          <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200">
            <Button colorScheme="blue" onClick={handleCloseModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default Audit;
