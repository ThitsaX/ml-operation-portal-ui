import { Box, Button, FormControl, FormErrorMessage, FormLabel, HStack, Heading, Input, Menu, MenuButton, MenuItem, MenuList, Stack, useToast, Select } from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { SettlementStatementReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateSettlementStatementReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type ISettlementStatementReport } from '@typescript/form/settlement-detail-report'

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone'
import { memo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from "react-redux";
import { RootState } from "@store";
import { useGetParticipantCurrencyList } from '@hooks/services';
import { useGetParticipantList } from '@hooks/services/participant';

const settlementStatementReportHelper = new SettlementStatementReportHelper()
const initialFileName = 'Settlement-Statement-Report'

const SettlementStatementReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [runButtonState, setRunButtonState] = useState(true);
  const { data: participantList } = useGetParticipantList();


  // Redux
  const user = useGetUserState()
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const { data: currencyList } = useGetParticipantCurrencyList();

  const onDownloadChangeHandler = (e: any) => {
    start()

    const fileType = e.target.value

    const startDate = getValues().startDate
    const endDate = getValues().endDate

    let utcStartDate = moment.utc(startDate).startOf('day').format();
    let utcEndDate = moment.utc(endDate).endOf('day').format();

    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementStatementReport(user, {
      startDate: utcStartDate,
      endDate: utcEndDate,
      timezoneoffset: tzOffSet,
      fileType: getValues().fileType,
      fspId: getValues().fspId,
      currency: getValues().currency
    })
      .then((res: any) => {
        if (res?.detail_report_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.detail_report_byte)
        } else {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          })
        }
      }).catch((e) => {
        console.log(e)
      }).finally(() => {
        complete()
      })
  }

  const { control, trigger, getValues, formState: { errors, isValid } } = useForm<ISettlementStatementReport>({
    resolver: zodResolver(settlementStatementReportHelper.schema),
    defaultValues: {
      startDate: moment().format('yyyy-MM-DD'),
      endDate: moment().format('yyyy-MM-DD'),
      fspId: '',
      currency: '',
      settlementId: '',
      fileType: ''
    },
    mode: 'onChange'
  })

  return (

    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        Settlement Statement Report
      </Heading>
      <Stack borderWidth="1px" borderRadius='lg' height="full" p="4">
        <HStack alignItems={'flex-start'} spacing={4}>
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
          <FormControl isInvalid={!isEmpty(errors.startDate)} pb="1">
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
          <FormControl isInvalid={!isEmpty(errors.currency)}>
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
    </Box>
  );
};

export default memo(SettlementStatementReport)
