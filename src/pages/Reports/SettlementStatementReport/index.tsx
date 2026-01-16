import {
  Button, FormControl, FormErrorMessage, FormLabel, HStack, Heading,
  Input, Stack,
  VStack, SimpleGrid,
  useToast,
  Box
} from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { SettlementStatementReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateSettlementStatementReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type ISettlementStatementReport } from '@typescript/form/report'

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone'
import { useMemo, useEffect, memo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from "react-redux";
import { RootState } from "@store";
import { useGetParticipantCurrencyList } from '@hooks/services';
import { useGetParticipantList } from '@hooks/services/participant';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from "@helpers/errors";
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from "@helpers";
import { showDataNotFound } from '@utils';

const settlementStatementReportHelper = new SettlementStatementReportHelper()
const initialFileName = 'DFSPSettlementStatementReport'

const SettlementStatementReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const { data: participantList } = useGetParticipantList();

  // Redux
  const user = useGetUserState()
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );
  const { data: currencyList } = useGetParticipantCurrencyList();

  const isHubUser =
    typeof user.data?.participantName === 'string' &&
    user.data.participantName.toLowerCase() === 'hub';

  const onDownloadChangeHandler = (e: any) => {
    start()

    const formData = getValues();
    const fileType = formData.fileType;

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    let tzOffSet: string = moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementStatementReport(user, {
      startDate: StartDate,
      endDate: EndDate,
      timezoneOffset: tzOffSet,
      fileType: fileType,
      fspId: isHubUser ? formData.fspId : user?.data?.participantName,
      currencyId: formData.currencyId
    })
      .then((res: any) => {
        if (res?.rptByte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.rptByte)
        } else {
          showDataNotFound(toast);
        }
      }).catch((error: IApiErrorResponse) => {
        if (error.error_code === REPORT_NOT_FOUND_ERROR) {
          showDataNotFound(toast);
          return;
        } else {
          toast({
            position: 'top',
            description: getErrorMessage(error) || 'Failed to download',
            status: 'error',
            isClosable: true,
            duration: 3000
          });
        }
      }).finally(() => {
        setRunButtonState(true);
        complete()
      })
  }

  const { control, trigger, setValue, getValues, formState: { errors, isValid } } = useForm<ISettlementStatementReport>({
    resolver: zodResolver(settlementStatementReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      fspId: 'ALL',
      currencyId: 'ALL',
      fileType: 'xlsx'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  return (

    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        Settlement Statement Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>DFSP Name</FormLabel>

            {isHubUser ? (
              <Controller
                name="fspId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    includeAllOption={true}
                    placeholder="Select DFSP"
                    options={(participantList ?? []).map(
                      (item): OptionType => ({
                        value: item.participantName,
                        label: item.description ? `${item.participantName} (${item.description})` : item.participantName,
                      })
                    )}
                    value={
                      field.value
                        ? field.value === 'ALL'
                          ? { value: 'ALL', label: 'ALL' }
                          : {
                            value: field.value,
                            label: (() => {
                              const p = participantList?.find(
                                (p) => p.participantName === field.value
                              );
                              return p
                                ? p.description
                                  ? `${p.participantName} (${p.description})`
                                  : p.participantName
                                : '';
                            })(),
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
            ) : (
              <Input
                value={user.data?.participantName || ""}
                readOnly
                bg="gray.100"
                _readOnly={{ opacity: 1, cursor: "not-allowed" }}
              />
            )}

            <FormErrorMessage>{errors.fspId?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.startDate)} pb="1">
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange, onBlur } }) => {
                return (
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('endDate');
                    }}
                    onBlur={onBlur}
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
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('startDate');
                    }}
                    onBlur={onBlur}
                  />
                );
              }}
              name="endDate"
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
                    { value: 'ALL', label: 'ALL' },
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
                          field.value === 'ALL'
                            ? 'ALL'
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
          <Box />
          <Box />
            <FormControl w="100%"
              display="flex"
              justifyContent={{ base: "stretch", md: "flex-end" }}
              alignItems="flex-end"
            >
          <Button colorScheme='blue'
            flex={{ base: '1', md: '0 0 50%' }}
            isDisabled={!isValid || !runButtonState}
            onClick={onDownloadChangeHandler}
            w={{ base: "100%", sm: "auto" }}>
            Download
          </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>
    </VStack >
  );
};

export default memo(SettlementStatementReport)
