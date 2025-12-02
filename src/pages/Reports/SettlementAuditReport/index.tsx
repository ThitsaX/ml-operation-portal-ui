import { useEffect, memo, useState, useMemo } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  VStack,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { SettlementAuditReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementAuditReport,
} from '@services/report';

import { type ISettlementAuditReport } from '@typescript/form/report';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { Controller, useForm } from "react-hook-form";
import { useGetParticipantList } from '@hooks/services/participant';
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantCurrencyList } from '@hooks/services/participant';
import { type IApiErrorResponse } from "@typescript/services";
import { getErrorMessage } from "@helpers/errors";
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const settlementAuditReportHelper = new SettlementAuditReportHelper();
const initialFileName = 'SettlementAuditReport';

const SettlementAuditReport = () => {

  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const [runButtonState, setRunButtonState] = useState(true);

  // custom hooks
  const { data: currencyList } = useGetParticipantCurrencyList();
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
    setValue,
    formState: { errors, isValid }
  } = useForm<ISettlementAuditReport>({
    resolver: zodResolver(settlementAuditReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'),
      dfspId: 'all',
      currencyId: 'all',
      fileType: 'xlsx',
      timezoneOffset: ''
    },
    mode: 'onChange'
  });
  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  /* Handlers */
  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    generateSettlementAuditReport({
      ...formData,
      startDate: StartDate,
      endDate: EndDate,
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
      .catch((error: IApiErrorResponse) => {
        toast({
          position: 'top',
          description: getErrorMessage(error) || 'Faield to download',
          status: 'warning',
          isClosable: true,
          duration: 3000
        });
      })
      .finally(() => {
        complete();
        setRunButtonState(true);
      });
  };


  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        Settlement Audit Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.dfspId)}>
            <FormLabel>DFSP Name</FormLabel>
            <Controller
              name="dfspId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  includeAllOption={true}
                  placeholder="Select DFSP"
                  options={(participantList ?? []).map(
                    (item): OptionType => ({
                      value: item.participantName,
                      label: item.participantName,
                    })
                  )}
                  value={
                    field.value
                      ? field.value === 'all'
                        ? { value: 'all', label: 'All' }
                        : {
                          value: field.value,
                          label:
                            participantList?.find(
                              (p) => p.participantName === field.value
                            )?.participantName || '',
                        }
                      : null
                  }
                  onChange={(selected: OptionType | null) => {
                    const value = selected?.value || '';
                    field.onChange(value);
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.dfspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.startDate)}>
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("endDate");
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
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("startDate");
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
                <CustomSelect
                  maxMenuHeight={300}
                  isClearable={false}
                  options={[
                    { value: 'all', label: 'All' },
                    ...(currencyList ?? []).map((item) => ({
                      value: item.currency,
                      label: item.currency,
                    })),
                  ]}
                  value={
                    field.value
                      ? {
                        value: field.value,
                        label:
                          field.value === 'all'
                            ? 'All'
                            : currencyList?.find((c) => c.currency === field.value)?.currency || '',
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder="Select Currency"
                />
              )}
            />
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">

          <Box />
          <Box />
          <FormControl w="100%">
            <Controller
              control={control}
              name="fileType"
              render={({ field }) => (
                <CustomSelect
                  options={[
                    { value: 'xlsx', label: 'XLSX' },
                    { value: 'csv', label: 'CSV' },
                  ]}
                  value={
                    field
                      ? {
                        value: field.value,
                        label: field.value.toUpperCase(),
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder="Choose Format"
                />
              )}
            />
          </FormControl>

          <Button
            colorScheme="blue"
            isDisabled={!isValid || !runButtonState}
            onClick={onDownloadChangeHandler}
            w={{ base: "100%", sm: "auto" }}
          >
            Download
          </Button>
        </SimpleGrid>
      </Stack>
    </VStack>
  );
};

export default memo(SettlementAuditReport);
