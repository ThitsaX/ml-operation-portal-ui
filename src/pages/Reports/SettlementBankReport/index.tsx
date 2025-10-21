import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Stack,
  useToast,
  Input,
  FormErrorMessage,
  VStack,
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementBankReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementBankReport,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { type ISettlementBankReport } from '@typescript/form/fee-report';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { IGetSettlementIds } from "@typescript/services/report";
import { useGetParticipantCurrencyList } from '@hooks/services';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';

const settlementBankReport = new SettlementBankReportHelper();
const initialFileName = 'SettlementBankReport';

const SettlementBankReport = () => {

  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [settlementId, setSettlementId] = useState("");

  const { data: currencyList } = useGetParticipantCurrencyList();
  // Redux
  const user = useGetUserState();
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const schema = settlementBankReport.schema;

  const {
    control,
    getValues,
    trigger,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<ISettlementBankReport>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'),
      endDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
      settlementId: '',
      currency: 'all',
      fileType: 'xlsx',
      timezoneOffset: '',
    },
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'));
    setValue('endDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));

  }, [selectedTimezone, setValue]);

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const values = getValues();

    const StartDate = moment.tz(values.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(values.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

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
        setValue('settlementId', '');
        setValue('fileType', 'xlsx');
      })
      .finally(() => {
        setRunButtonState(true);
        complete();
      });
  }, [complete, getValues, start, toast, user]);

  const onSearchClick = useCallback(async () => {
    search();
  }, [search]);

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;

    generateSettlementBankReport(user, {
      settlementId: formData.settlementId,
      currencyId: formData.currency,
      timezoneOffset: selectedTimezone.offset === 0
        ? "0000"
        : moment().tz(selectedTZString).format('ZZ').replace('+', ''),
      fileType: fileType
    })
      .then((res: any) => {
        if (res?.rptByte?.length > 0) {
          downloadFile(initialFileName, fileType, res.rptByte);
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

    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Stack>
        <Heading fontSize="2xl" fontWeight="bold" mb={6}>Settlement Bank Report</Heading>
      </Stack>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl
            isInvalid={!isEmpty(errors.startDate)}
          >
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <Input
                  {...field}
                  type="datetime-local"
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("endDate");
                    setSettlementIdOptions([]);
                    setSettlementId("");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.endDate)}
          >
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <Input
                  {...field}
                  type="datetime-local"
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("startDate");
                    setSettlementIdOptions([]);
                    setSettlementId("");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>
          <Box />
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
              w={{ base: "100%", md: "50%" }}
            >
              Search
            </Button>
          </FormControl>

        </SimpleGrid>
      </Stack>

      {settlementIdOptions.length > 0 && (<Stack borderWidth="1px" w="full" borderRadius="lg" p={4} spacing={4}>
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl
            w="100%"
            isInvalid={!isEmpty(errors.settlementId)}
          >
            <FormLabel>Settlement ID:</FormLabel>
            <Controller
              name="settlementId"
              control={control}

              render={({ field }) => (
                <CustomSelect
                  maxMenuHeight={300}
                  isClearable={true}
                  options={settlementIdOptions}
                  value={
                    field.value
                      ? {
                        value: field.value,
                        label: settlementIdOptions.find((s) => s.value === field.value)?.label || '',
                      }
                      : null
                  }
                  onChange={(selected: OptionType | null) => {
                    field.onChange(selected?.value || '');
                    setSettlementId(selected?.value || '');
                  }}
                  placeholder="Select Settlement ID"
                />

              )}
            />
          </FormControl>

          <FormControl
            w="100%"
            isInvalid={!isEmpty(errors.currency)}
          >
            <FormLabel>Currency</FormLabel>
            <Controller
              name="currency"
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
            <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
          </FormControl>
          <FormControl w="100%" mt={8}>

            <Controller
              control={control}
              name="fileType"
              render={({ field }) => (
                <CustomSelect
                  options={[
                    { value: 'xlsx', label: 'XLSX' },
                    { value: 'pdf', label: 'PDF' },
                  ]}
                  value={field ? { value: field.value, label: field.value.toUpperCase() } : null}
                  onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                  placeholder="Choose Format"
                />
              )}
            />
          </FormControl>
          <FormControl w="100%"
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
            mt="5px"
          >
            <Button
              colorScheme="blue"
              onClick={onDownloadChangeHandler}
              isDisabled={!settlementId || !runButtonState}
              w={{ base: "100%", md: "50%" }}
            >
              Download
            </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>
      )
      }
    </VStack >
  );
};

export default memo(SettlementBankReport);
