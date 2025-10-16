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
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from "@helpers/errors";
import { CustomSelect } from '@components/interface';

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
        if (res?.rptByte?.length > 0) {
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
      }).catch((error: IApiErrorResponse) => {
        toast({
          position: 'top',
          description: getErrorMessage(error) || 'Faield to download',
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
    setValue('startDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'));
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
                    <CustomSelect
                    isMulti={false}
                    maxMenuHeight={300}
                    isClearable={true}
                    placeholder="Select DFSP Name"
                      options={[
                        { value: "all", label: "All" },
                        ...(participantList?.map((item) => ({
                          value: item.participantName,
                          label: item.participantName
                        })) || [])
                      ]}
                      value={field.value ? { value: field.value, label: field.value === "all" ? "ALL" : field.value } : null}
                      onChange={(selectedOption) => {
                        field.onChange(selectedOption?.value || '');
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
                <CustomSelect
                isMulti={false}
                maxMenuHeight={300}
                isClearable={true}
                placeholder="Select Currency"
                  options={[
                    { value: "all", label: "All" },
                    ...(currencyList?.map((item) => ({
                      value: item.currency,
                      label: item.currency
                    })) || [])
                  ]}
                  value={field.value ? { value: field.value, label: field.value === "all" ? "ALL" : field.value } : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
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
                <CustomSelect
                  options={[
                    { value: "xlsx", label: "XLSX" },
                    { value: "csv", label: "CSV" }
                  ]}
                  value={field.value ? { value: field.value, label: field.value === "xlsx" ? "XLSX" : "CSV" } : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
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
