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
import { SettlementDetailReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementDetailReport,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementDetailReport } from '@typescript/form/settlement-detail-report';

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
import { useGetParticipantList } from '@hooks/services/participant';


const settlementDetailReportHelper = new SettlementDetailReportHelper();
const initialFileName = 'Settlement-Details-Report';

const SettlementDetailReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();


  // Redux
  const user = useGetUserState();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const { data: participantList } = useGetParticipantList();

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm<ISettlementDetailReport>({
    resolver: zodResolver(settlementDetailReportHelper.schema),
    defaultValues: {
      fspId: '',
      settlementId: '',
      fileType: '',
      startDate: moment().format('yyyy-MM-DD'),
      endDate: moment().format('yyyy-MM-DD'),
    },
    mode: 'onChange'
  });

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');
    generateSettlementDetailReport({
      settlementId: getValues().settlementId,
      fspId: getValues().fspId,
      fileType: getValues().fileType,
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

    const startDate = getValues().startDate;
    const endDate = getValues().endDate;

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

  return (
    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        Settlement Detail Report
      </Heading>
      <Stack borderWidth="1px" borderRadius="lg" height="full" p="2" mb={4}>
        <HStack alignItems={'flex-start'} p={2} spacing={8}>

          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>DFSP Name</FormLabel>
            <Controller
              name="fspId"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select DFSP">
                  {participantList?.map((item, index) => (
                    <option key={index} value={item.participantName}>
                      {item.description}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormErrorMessage>{errors.fspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.startDate)}
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
                      trigger('endDate');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="startDate"
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} pb="1">
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
                      trigger('startDate');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="endDate"
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.fspId)} textAlign="right">
            <Button onClick={handleSubmit(onSearchClick)} isDisabled={!isValid}
              colorScheme='blue' gap="2"
              size='md'
              mt="30px">
              <FaSearch /> Search
            </Button>
          </FormControl>

        </HStack>
      </Stack>
      {settlementIdOptions.length > 0 && (<Stack borderWidth="1px" borderRadius="lg" p={4} height="full">
        <HStack alignItems={'flex-start'} p={2} spacing={4}>

          <FormControl
            width={{ base: '200px', md: '250px' }}
            isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>Settlement ID</FormLabel>
            <Controller
              name="settlementId"
              control={control}
              render={({ field }) => (
                <Select {...field}
                  onChange={(e) => field.onChange(e.target.value)}
                  value={field.value || ""} placeholder="Select Settlement ID">
                  {settlementIdOptions.map((opt, index) => (
                    <option key={index} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormControl>

        </HStack>
        <HStack justifyContent='flex-end' p={2}>

          <FormControl width="250px">
            <Controller
              control={control}
              name="fileType"
              render={({ field }) => (
                <Select {...field} placeholder="Choose Format" width="250px">
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </Select>
              )}
            />
          </FormControl>

          <Button colorScheme='blue' isDisabled={!isValid || !runButtonState} onClick={onDownloadChangeHandler}>
            Download
          </Button>
        </HStack>
      </Stack>
      )}
    </Box>
  );
};

export default memo(SettlementDetailReport);
