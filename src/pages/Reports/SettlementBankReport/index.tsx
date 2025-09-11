import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Stack,
  useToast,
  Select,
  Input,
  FormErrorMessage
} from '@chakra-ui/react';
import { SettlementBankReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateFeeReport,
  getAllOtherParticipants,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { type IGetAllOtherParticipant } from '@typescript/services';
import { type ISettlementBankReport } from '@typescript/form/fee-report';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { TransferType } from '@typescript/pages';
import { FaSearch } from "react-icons/fa";
import { IGetSettlementIds } from "@typescript/services/report";
import { useGetHubCurrency } from '@hooks/services';

const settlementBankReport = new SettlementBankReportHelper();
const initialFileName = 'Settlement-Bank-Report';

const SettlementBankReport = () => {

  const [runButtonState, setRunButtonState] = useState(true);
  const [transferType, setTransferType] = useState<TransferType>('outbound');
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<
    { value: string; label: string }[]
  >([
    { value: '', label: 'Select Settlement ID' }, // placeholder
    { value: 'SETTLEMENT-001', label: 'Settlement ID - 001' },
    { value: 'SETTLEMENT-002', label: 'Settlement ID - 002' },
    { value: 'SETTLEMENT-003', label: 'Settlement ID - 003' },
  ]);

  const [selectedSettlementId, setSelectedSettlementId] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const [toFspOptions, setToFspOptions] = useState<any[]>([]);
  const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string; }>();
  const { data: currencyList } = useGetHubCurrency();
  // Redux
  const user = useGetUserState();
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  const schema = settlementBankReport.schema;

  const {
    control,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ISettlementBankReport>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
    },
    mode: 'onChange'
  });

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const startDate = getValues().start_date;
    const endDate = getValues().end_date;

    let utcStartDate = moment.utc(startDate).startOf('day').format();
    const utcEndDate = moment.utc(endDate).endOf('day').format();

    //Getting offset
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTimezone.value).format('ZZ').replace('+', '');

    getSettlementIds(user, utcStartDate, utcEndDate, tzOffSet)
      .then((data: IGetSettlementIds) => {
        if (data.settlementIdDataList?.length === 0) {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          });
        }

        let options: any[] = [];

        data.settlementIdDataList.map((item) => {
          options.push({ value: item.settlementId, label: item.settlementId });
        });

        setSettlementIdOptions(options);

        setSelectedSettlementId(null);
      })
      .finally(() => {
        setRunButtonState(true);
        complete();
      });
  }, [complete, getValues, start, toast, user]);

  const onSearchClick = useCallback(() => {
    search();
  },
    [search]
  );

  useEffect(() => {
    getAllOtherParticipants(user, {
      participantId: user.data?.participantId
    }).then((data) => {
      prepareToFspsOptions(data);
    });
  }, []);

  const prepareToFspsOptions = (data: IGetAllOtherParticipant) => {
    const options: any[] = [];

    options.push({ value: 'all', label: 'All' }); /** Default option */

    data.participantInfoList.map((toFsp) => {
      options.push({ value: toFsp.dfsp_code, label: toFsp.dfsp_code });
    });

    setToFspOptions(options);
    setSelectedToFspOption(options[0]);
  };

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const fileType = e.target.value;

    // const startDate = getValues().start_date;
    // const endDate = getValues().end_date;

    // const utcStartDate = moment.utc(startDate).startOf('day').format();
    // const utcEndDate = moment.utc(endDate).endOf('day').format();

    const selectedTZString = selectedTimezone.value;

    generateFeeReport(user, {
      fromFspId: transferType === 'outbound' ? user.data?.participantName : selectedToFspOption?.value,
      toFspId: transferType === 'outbound' ? selectedToFspOption?.value : user.data?.participantName,
      tzOffSet: selectedTimezone.offset === 0
        ? "0000"
        : moment().tz(selectedTZString).format('ZZ').replace('+', ''),
      fileType
    })
      .then((res: any) => {
        if (res?.rpt_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res.rpt_byte);
        } else {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          });
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        complete();
        setRunButtonState(true);
      });
  };

  return (
    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" p="3">
        Settlement Bank Report
      </Heading>
      <Stack borderWidth="1px" borderRadius="lg" height="full" p="2" mb={4}>
        <HStack alignItems={'flex-start'} p={2} spacing={8}>

          <FormControl
            isInvalid={!isEmpty(errors.start_date)}
            pb="1">
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange, onBlur } }) => {
                return (
                  <Input
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('end_date');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="start_date"
            />
            <FormErrorMessage>{errors.start_date?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.end_date)} pb="1">
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error }
              }) => {
                return (
                  <Input
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('start_date');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="end_date"
            />
            <FormErrorMessage>{errors.end_date?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.settlementId)} textAlign="right">
            <Button onClick={handleSubmit(onSearchClick)} isDisabled={!isValid}
              colorScheme='blue' gap="2"
              mt="30px"
              size='md'>
              <FaSearch /> Search
            </Button>
          </FormControl>

        </HStack>
      </Stack>
      <Stack borderWidth="1px" borderRadius="lg" p={4} height="full">
        <HStack alignItems={'flex-start'} p={2} spacing={4}>


          <FormControl
            width={{ base: '200px', md: '250px' }}
            isInvalid={!isEmpty(errors.settlementId)}>
            <FormLabel>Settlement ID:</FormLabel>
            <Controller
              name="settlementId"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Settlement ID">
                  {settlementIdOptions.map((opt, index) => (
                    <option key={index} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormControl>
          <FormControl width={{ base: '200px', md: '250px' }} isInvalid={!isEmpty(errors.currency)}>
            <FormLabel>Currency</FormLabel>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Currency">
                  {currencyList?.map((item, index) => (
                    <option key={index} value={item.currency}>
                      {item.currency}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
          </FormControl>


        </HStack>
        <HStack justifyContent='flex-end' p={2}>
          <Select
            placeholder="Choose Format"
            value={settlementModel}
            onChange={(e) => setSettlementModel(e.target.value)}
            width="250px"
          >
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </Select>
          <Button colorScheme='blue' isDisabled={!isValid || !runButtonState} onClick={onDownloadChangeHandler}>
            Download
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default memo(SettlementBankReport);
