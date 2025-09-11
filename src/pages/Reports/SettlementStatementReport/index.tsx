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
import { useGetHubCurrency } from '@hooks/services';

const settlementStatementReportHelper = new SettlementStatementReportHelper()
const initialFileName = 'Settlement-Statement-Report'

const SettlementStatementReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [runButtonState, setRunButtonState] = useState(true);


  // Redux
  const user = useGetUserState()
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const { data: currencyList } = useGetHubCurrency();

  const onDownloadChangeHandler = (e: any) => {
    start()

    const fileType = e.target.value

    const startDate = getValues().start_date
    const endDate = getValues().end_date

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
      fileType: fileType
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
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
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
          <FormControl pb="1">
            <FormLabel>DFSP ID:</FormLabel>
            <Input value={user.data?.participantName} placeholder="Enter DFSP ID:" />
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.start_date)} pb="1">
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
          <Select
            placeholder="Choose Format"
            value={settlementModel}
            onChange={(e) => setSettlementModel(e.target.value)}
            width="250px"
          >
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </Select>
          <Button colorScheme='blue' isDisabled={!isValid || !runButtonState} onClick={onDownloadChangeHandler}>
            Download
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default memo(SettlementStatementReport)
