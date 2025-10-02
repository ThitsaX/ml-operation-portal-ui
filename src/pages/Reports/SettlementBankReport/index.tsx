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
  FormErrorMessage,
  VStack,
  SimpleGrid
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
import { useGetParticipantCurrencyList } from '@hooks/services';

const settlementBankReport = new SettlementBankReportHelper();
const initialFileName = 'Settlement-Bank-Report';

const SettlementBankReport = () => {

  const [runButtonState, setRunButtonState] = useState(true);
  const [transferType, setTransferType] = useState<TransferType>('outbound');
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);

  const [selectedSettlementId, setSelectedSettlementId] = useState<{
    value: string;
    label: string;
  } | null>(null);

  const [toFspOptions, setToFspOptions] = useState<any[]>([]);
  const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string; }>();
  const { data: currencyList } = useGetParticipantCurrencyList();
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
      start_date: moment().format('YYYY-MM-DDTHH:mm'),
      end_date: moment().format('YYYY-MM-DDTHH:mm')
    },
    mode: 'onChange'
  });

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const values = getValues();
    const currentTimeZone = moment.tz.guess();

    // Convert to UTC
    const utcStartDate = moment(values.start_date)
      .tz(selectedTimezone?.value || currentTimeZone)
      .utc()
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const utcEndDate = moment(values.end_date)
      .tz(selectedTimezone?.value || currentTimeZone)
      .utc()
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

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

  const onSearchClick = useCallback(async () => {
    const isValid = await trigger();
    if (isValid) {
      search();
    }
  }, [search, trigger]);

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

    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Stack>
        <Heading fontSize="2xl" mb={6}>Settlement Bank Report</Heading>
      </Stack>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        {/* --- Filters Section // 1 per row on mobile, 2 on md, 4 on lg+ */}
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          spacing={4}
          w="full"
        >
          <FormControl
            isInvalid={!isEmpty(errors.start_date)}
          >
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <Input
                  {...field}
                  type="datetime-local"
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("end_date");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.start_date?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.end_date)}
          >
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <Input
                  {...field}
                  type="datetime-local"
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("start_date");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.end_date?.message}</FormErrorMessage>
          </FormControl>


          {/* Search Button */}
          <FormControl
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
            mb={1}
          >
            <Button
              onClick={handleSubmit(onSearchClick)}
              isDisabled={!isValid}
              colorScheme="blue"
              gap="2"
              size="md"
              w={{ base: "100%", md: "auto" }}
            >
              <FaSearch /> Search
            </Button>
          </FormControl>

        </SimpleGrid>
      </Stack>

      {/* --- Settlement & Download --- */}
      {settlementIdOptions.length > 0 && (<Stack borderWidth="1px" w="full" borderRadius="lg" p={4} spacing={4}>
        {/* Top Row: Settlement ID & Currency */}
        <Stack
          w="full"
          direction={{ base: "column", md: "row" }}
          spacing={4}
          flexWrap="wrap"
          align="flex-end"
        >
          <FormControl
            width={{ base: "100%", md: "220px" }}
            isInvalid={!isEmpty(errors.settlementId)}
          >
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

          <FormControl
            width={{ base: "100%", md: "220px" }}
            isInvalid={!isEmpty(errors.currency)}
          >
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
        </Stack>

        {/* Bottom Row: Format & Download */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          justify="flex-end"
          align="flex-end"
          flexWrap="wrap"
        >
          <Select
            placeholder="Choose Format"
            value={settlementModel}
            onChange={(e) => setSettlementModel(e.target.value)}
            width={{ base: "100%", md: "220px" }}
          >
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </Select>

          <Button
            colorScheme="blue"
            width={{ base: "100%", md: "auto" }}
            isDisabled={!isValid || !runButtonState}
            onClick={onDownloadChangeHandler}
          >
            Download
          </Button>
        </Stack>
      </Stack>
      )}
    </VStack>


  );
};

export default memo(SettlementBankReport);
