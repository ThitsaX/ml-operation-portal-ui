import {
  Button, FormControl, FormErrorMessage, FormLabel, HStack, Heading,
  Input, Stack,
  VStack, SimpleGrid,
  useToast, Select
} from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { SettlementStatementReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateSettlementStatementReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type ISettlementStatementReport } from '@typescript/form/settlement-detail-report'

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone'
import { useMemo, useEffect, memo, useState } from 'react'
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

  const [settlementId, setSettlementId] = useState("");
  const [fspId, setFspId] = useState("");

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
      .format();

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format();

    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementStatementReport(user, {
      startDate: StartDate,
      endDate: EndDate,
      timezoneOffset: tzOffSet,
      fileType: fileType,
      fspId: isHubUser ? formData.fspId : user?.data?.participantName,
      currencyId: formData.currencyId
    })
      .then((res: any) => {
        if (res?.detail_report_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.rptByte)
        } else {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          })
        }
      }).catch((error) => {
        const message = `${error?.default_error_message ?? ''}: ${error?.error_code ?? ''} ${error?.description ?? ''}`;
        toast({
          position: 'top',
          description: message || 'Faield to download',
          status: 'warning',
          isClosable: true,
          duration: 3000
        });
      }).finally(() => {
        setRunButtonState(true);
        complete()
      })
  }

  const { control, trigger, setValue, getValues, formState: { errors, isValid } } = useForm<ISettlementStatementReport>({
    resolver: zodResolver(settlementStatementReportHelper.schema),
    defaultValues: {
      startDate: moment().format('YYYY-MM-DDTHH:mm'),
      endDate: moment().format('YYYY-MM-DDTHH:mm'),
      fspId: 'all',
      currencyId: 'all',
      settlementId: '',
      fileType: 'xlsx'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));
    setValue('endDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));

  }, [selectedTimezone, setValue]);

  return (

    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" mb={6}>
        Settlement Statement Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }} // 1 per row on mobile, 2 on md, 4 on lg+
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
                  <Select {...field} width="100%"
                    onChange={(e) => {
                      field.onChange(e);
                      setFspId(e.target.value);
                    }}>
                    <option value="" disabled hidden>
                      Select DFSP
                    </option>
                    <option value="all">All</option>
                    {participantList?.map((item, index) => (
                      <option key={index} value={item.participantName}>
                        {item.participantName}
                      </option>
                    ))}
                  </Select>
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
                  <Input
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('endDate');
                    }}
                    onBlur={onBlur}
                    type="datetime-local"
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
                    type="datetime-local"
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
                <Select {...field}>
                  <option value="" disabled hidden>
                    Select Currency
                  </option>
                  <option value="all">All</option>
                  {currencyList?.map((item, index) => (
                    <option key={index} value={item.currency}>
                      {item.currency}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormErrorMessage>{errors.currencyId?.message}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        {/* Download Section */}
        <Stack
          direction={{ base: "column", md: "row" }}
          spacing={4}
          justify={{ base: "flex-start", md: "flex-end" }}
          w="full">

          <FormControl w={{ base: "100%", sm: "auto", md: "250px" }}>
            <Controller
              control={control}
              name="fileType"
              render={({ field }) => (
                <Select {...field}>
                  <option value="" disabled hidden>
                    Choose Format
                  </option>
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </Select>
              )}
            />
          </FormControl>

          <Button colorScheme='blue'
            isDisabled={!isValid || !runButtonState}
            onClick={onDownloadChangeHandler}
            w={{ base: "100%", sm: "auto" }}>
            Download
          </Button>
        </Stack>
      </Stack>
    </VStack >
  );
};

export default memo(SettlementStatementReport)
