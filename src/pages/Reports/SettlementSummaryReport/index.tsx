import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  HStack,
  VStack,
  Select,
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementSummaryReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateSettlementReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementSummaryReport } from '@typescript/form/settlement-detail-report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { useMemo, useEffect, memo, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';
import { useGetParticipantCurrencyList } from '@hooks/services';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';

const settlementSummaryReportHelper = new SettlementSummaryReportHelper();
const initialFileName = 'Settlement-Details-Report';

const SettlementSummaryReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();

  // Redux

  const { data: currencyList } = useGetParticipantCurrencyList();

  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );
  const user = useGetUserState();
  const { data: participantList } = useGetParticipantList();

  const [settlementId, setSettlementId] = useState("");
  const [fspId, setFspId] = useState("");

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
  } = useForm<ISettlementSummaryReport>({
    resolver: zodResolver(settlementSummaryReportHelper.schema),
    defaultValues: {
      fspId: 'all',
      settlementId: '',
      currencyId: 'all',
      fileType: 'xlsx',
      startDate: moment().format('YYYY-MM-DDTHH:mm'),
      endDate: moment().format('YYYY-MM-DDTHH:mm')
    },
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'));
    setValue('endDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));

  }, [selectedTimezone, setValue]);

  /* Handlers */
  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    generateSettlementReport({
      settlementId: formData.settlementId,
      currencyId: formData.currencyId,
      fspId: isHubUser ? formData.fspId : user?.data?.participantName,
      fileType: fileType,
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
        setRunButtonState(true);
        complete();
      });
  };

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const currentTimeZone = moment.tz.guess();

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format();

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format();

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    getSettlementIds(user, StartDate, EndDate, tzOffSet)
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

        setSettlementId("");
        setValue('settlementId', ''); // update form state

        // Optional: reset file type if needed
        setValue('fileType', 'xlsx');
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
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" mb={6}>
        Settlement Summary Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        {/* --- Filters Section --- // 1 per row on mobile, 2 on md, 4 on lg+*/}
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">

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
              name="startDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("endDate");
                    setSettlementIdOptions([]);
                    setSettlementId(""); // also clear selected settlementId
                  }}
                  onBlur={onBlur}
                  type="datetime-local"
                  width="100%"
                />
              )}
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} pb="1">
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("startDate");
                    setSettlementIdOptions([]);
                    setSettlementId(""); // also clear selected settlementId
                  }}
                  onBlur={onBlur}
                  type="datetime-local"
                  width="100%"
                />
              )}
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
            mb={1}
          >
            <Button
              onClick={handleSubmit(onSearchClick)}
              isDisabled={!isValid}
              colorScheme="blue"
              gap="2"
              size="md"
              w={{ base: "100%", md: "auto" }}
            >
              <FaSearch /> Search
            </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>

      {settlementIdOptions.length > 0 && (
        <Stack borderWidth="1px" borderRadius="lg" p={4} w="full" spacing={4}>

          <HStack
            spacing={4}
            align="flex-start"
            wrap="wrap" // allows stacking on small screens
          >
            <FormControl isInvalid={!isEmpty(errors.settlementId)}
              w={{ base: "100%", sm: "auto", md: "250px" }}>
              <FormLabel>Settlement ID:</FormLabel>
              <Controller
                name="settlementId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    isMulti={false}
                    maxMenuHeight={300}
                    isClearable={true}
                    placeholder="Select Settlement ID"
                    options={settlementIdOptions}
                    value={field.value ? { value: field.value, label: field.value } : null}
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption?.value || '');
                      setSettlementId(selectedOption?.value || '');
                    }}
                  />
                )}
              />
            </FormControl>
            <FormControl
              width={{ base: "100%", md: "220px" }}
              isInvalid={!isEmpty(errors.currencyId)}
            >
              <FormLabel>Currency</FormLabel>
              <Controller
                name="currencyId"
                control={control}
                render={({ field }) => (
                  <Select {...field} >
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
          </HStack>

          {/* FileType + Download */}
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={{ base: 3, md: 4 }}
            justify={{ base: "flex-start", md: "flex-end" }}
            align={{ base: "stretch", md: "center" }}
            w="full"
          >
            <FormControl w={{ base: "100%", md: "250px" }}>
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

            <Button
              colorScheme="blue"
              isDisabled={!settlementId || !runButtonState}
              onClick={onDownloadChangeHandler}
              w={{ base: "100%", md: "auto" }}
            >
              Download
            </Button>
          </Stack>
        </Stack>
      )}
    </VStack>
  );
};

export default memo(SettlementSummaryReport);
