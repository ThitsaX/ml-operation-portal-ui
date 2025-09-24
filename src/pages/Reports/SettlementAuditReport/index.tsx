import { memo, useState, useMemo } from "react";
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
import { SettlementAuditReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementAuditReport,
} from '@services/report';

import { type ISettlementAuditReport } from '@typescript/form/settlement-audit-report';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { Controller, useForm } from "react-hook-form";
import { useGetParticipantList } from '@hooks/services/participant';
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantCurrencyList } from '@hooks/services/participant';


const settlementAuditReportHelper = new SettlementAuditReportHelper();
const initialFileName = 'Settlement-Audit-Report';

const SettlementAuditReport = () => {

  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [runButtonState, setRunButtonState] = useState(true);

  // custom hooks 
  const { data } = useGetParticipantCurrencyList();
  const { data: participantList } = useGetParticipantList();

  // Redux

  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm<ISettlementAuditReport>({
    resolver: zodResolver(settlementAuditReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').toISOString(),
      endDate: moment().tz(selectedTZString).endOf('d').toISOString(),
      dfspId: '',
      currencyId: '',
      fileType: '',
      timezoneOffset: ''
    },
    mode: 'onChange'
  });

  /* Handlers */
  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementAuditReport({
      ...formData,
      timezoneOffset: tzOffSet
    })
      .then((res: any) => {
        if (res?.rptByte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.rptByte);
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


  return (
    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        Settlement Audit Report
      </Heading>
      <Stack borderWidth="1px" borderRadius="lg" height="full" p="4" spacing={4}>
        <HStack alignItems={'flex-start'} spacing={4}>

          <FormControl isInvalid={!isEmpty(errors.currencyId)}>
            <FormLabel>DFSP Name</FormLabel>
            <Controller
              name="dfspId"
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
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.startDate)}>
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  type="date"
                  value={moment(value).format('YYYY-MM-DD')}
                  onChange={(event) => {
                    // Set ISO string at start of day
                    const date = moment(event.target.value, 'YYYY-MM-DD')
                      .startOf('day')
                      .toISOString();
                    onChange(date);
                    trigger('endDate');
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)}>
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange } }) => (
                <Input
                  type="date"
                  value={moment(value).format('YYYY-MM-DD')}
                  onChange={(event) => {
                    // Set ISO string at start of day
                    const date = moment(event.target.value, 'YYYY-MM-DD')
                      .startOf('day')
                      .toISOString();
                    onChange(date);
                    trigger('startDate');
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.currencyId)}>
            <FormLabel>Currency</FormLabel>
            <Controller
              name="currencyId"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select Currency">
                  {data?.map((item, index) => (
                    <option key={index} value={item.currency}>
                      {item.currency}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>
        </HStack>
        <HStack justifyContent='flex-end'>

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
          <Button
            colorScheme='blue'
            isDisabled={!isValid || !runButtonState}
            onClick={onDownloadChangeHandler}
          >
            Download
          </Button>
        </HStack>

      </Stack>
    </Box >
  );
};

export default memo(SettlementAuditReport);
