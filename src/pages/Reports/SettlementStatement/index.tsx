import { Box, Button, FormControl, FormErrorMessage, FormLabel, HStack, Heading, Input, Menu, MenuButton, MenuItem, MenuList, Stack, useToast } from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { SettlementReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateSettlementStatementReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type ISettlementDetailReport } from '@typescript/form/settlement-detail-report'

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone'
import { memo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FaCaretDown } from 'react-icons/fa'
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from "react-redux";
import { RootState } from "@store";

const settlementHelper = new SettlementReportHelper()

const SettlementStatement = () => {
  const { start, complete } = useLoadingContext()
  const toast = useToast()

  const user = useGetUserState()
  const initialFileName = 'Settlement-Statement-Report'
  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

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

  const { control, trigger, getValues, formState: { errors, isValid } } = useForm<ISettlementDetailReport>({
    resolver: zodResolver(settlementHelper.schema),
    defaultValues: {
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
    },
    mode: 'onChange'
  })

  return (

    <Box height="full" w="400px" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        DFSP Settlement Statement Report
      </Heading>
      <Stack borderWidth="1px" borderRadius='lg' height="full" p="4">
        <FormControl pb="1">
          <FormLabel>FspId</FormLabel>
          <Input value={user.data?.dfsp_code} readOnly={true} />
        </FormControl>
        <FormControl isInvalid={!isEmpty(errors.start_date)} isRequired pb="1">
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
        <FormControl isInvalid={!isEmpty(errors.end_date)} isRequired pb="1">
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

        <HStack justifyContent='flex-end' p={2}>
          <Menu>
            <MenuButton as={Button} rightIcon={<FaCaretDown />} isDisabled={!isValid}>
              Run
            </MenuButton>
            <MenuList onClick={onDownloadChangeHandler} placeholder="Choose" >
              <MenuItem value="csv">Download CSV</MenuItem>
              <MenuItem value="xlsx">Download Excel</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Stack>
    </Box>
  );
};

export default memo(SettlementStatement)
