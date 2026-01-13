import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Stack,
  useToast,
  VStack,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { TransactionDetailReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateTransactionDetailReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ITransactionDetailReport } from '@typescript/form/report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { useMemo, useEffect, memo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';
import { useGetParticipantCurrencyList, useGetAllTransferStates } from '@hooks/services';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const transactionDetailReportHelper = new TransactionDetailReportHelper();
const initialFileName = 'TransactionDetailReport';

const TransactionDetailReport = () => {
  const tranStateRes = useGetAllTransferStates();
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );
  const user = useGetUserState();
  const isHubUser =
    typeof user.data?.participantName === 'string' &&
    user.data.participantName.toLowerCase() === 'hub';

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm<ITransactionDetailReport>({
    resolver: zodResolver(transactionDetailReportHelper.schema),
    defaultValues: {
      state: 'ALL',
      fileType: 'xlsx',
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    },
    mode: 'onChange'
  });



  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

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

    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateTransactionDetailReport(user, {
      startDate: StartDate,
      endDate: EndDate,
      state: formData.state,
      fileType: fileType,
      timezoneOffset: tzOffSet,
      dfspId: isHubUser ? 'all' : user?.data?.participantName
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
          status: 'error',
          isClosable: true,
          duration: 3000
        });
      })
      .finally(() => {
        setRunButtonState(true);
        complete();
      });
  };

  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        Transaction Detail Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
          pb={2}
        >
          <FormControl isInvalid={!isEmpty(errors.startDate)} position="relative" pb={3}>
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("endDate");
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} position="relative" pb={3}>
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("startDate");
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.state)}>
            <FormLabel>Status</FormLabel>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  includeAllOption={true}
                  maxMenuHeight={300}
                  placeholder="Transfer State"
                  options={tranStateRes?.data?.transferStateInfoList?.map((item) => ({
                    value: item.transferStateId,
                    label: item.transferState
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl w="100%" mt={8}>
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

        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">
          <Box />
          <Box />
          <Box />
          <FormControl w="100%"
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
          >
            <Button
              flex={{ base: '1', md: '0 0 50%' }}
              colorScheme="blue"
              isDisabled={!isValid || !runButtonState}
              onClick={onDownloadChangeHandler}
              w={{ base: "100%", sm: "auto" }}
            >
              Download
            </Button>
          </FormControl>
        </SimpleGrid>

      </Stack>
    </VStack>
  );
};

export default memo(TransactionDetailReport);
