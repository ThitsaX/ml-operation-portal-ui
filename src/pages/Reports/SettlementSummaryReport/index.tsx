import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  HStack,
  Select
} from '@chakra-ui/react';
import { SettlementSummaryReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateSettlementDetailReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementSummaryReport } from '@typescript/form/settlement-detail-report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';


const settlementSummaryReportHelper = new SettlementSummaryReportHelper();
const initialFileName = 'Settlement-Details-Report';

const SettlementSummaryReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const user = useGetUserState();

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm<ISettlementSummaryReport>({
    resolver: zodResolver(settlementSummaryReportHelper.schema),
    defaultValues: {
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
    },
    mode: 'onChange'
  });

  /* Handlers */
  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const fileType = e.target.value;

    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementDetailReport({
      settlement_id: selectedSettlementId?.value,
      fspid: user.data?.participantName,
      file_type: fileType,
      timezoneOffset: tzOffSet
    })
      .then((res: any) => {
        if (res?.detail_report_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.detail_report_byte);
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
      });
  };

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
        if (data.settlement_id_list?.length === 0) {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          });
        }

        let options: any[] = [];

        data.settlement_id_list.map((item) => {
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

  return (
    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        Settlement Summary Report
      </Heading>
      <Stack borderWidth="1px" borderRadius='lg' height="full" p="4">
        <HStack alignItems={'flex-end'} spacing={4}>
          <FormControl pb="1">
            <FormLabel>DFSP ID:</FormLabel>
            <Input value={user.data?.participantName} readOnly={true} />
          </FormControl>

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

          <FormControl isInvalid={!isEmpty(errors.fspid)} textAlign="right">
            <Button onClick={handleSubmit(onSearchClick)} isDisabled={!isValid}
              colorScheme='blue' gap="2"
              size='md'>
              <FaSearch /> Search
            </Button>
          </FormControl>

        </HStack>
        <HStack justifyContent='flex-end' p={2}>

          <FormControl
            width={{ base: '200px', md: '250px' }}
            isInvalid={!isEmpty(errors.settlement_id)}
            isRequired
          >
            <FormLabel>Settlement Id</FormLabel>
            <Controller
              name="settlement_id"
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

export default memo(SettlementSummaryReport);
