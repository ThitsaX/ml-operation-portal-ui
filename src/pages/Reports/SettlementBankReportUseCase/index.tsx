import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Stack,
  HStack,
  Spinner,
  Text,
  useToast,
  FormErrorMessage,
  VStack,
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementBankReportUseCaseHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementBankReportUseCase,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useMemo, useEffect, useState, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { type ISettlementBankReportUseCase } from '@typescript/form/report';
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
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useReportDownloadState } from '@hooks/useReportDownloadState';

const settlementBankReportUseCase = new SettlementBankReportUseCaseHelper();
const initialFileName = 'SettlementBankReport_UseCase';

const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const SettlementBankReportUseCase = () => {

  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [settlementId, setSettlementId] = useState("");
  const readyToastId = 'settlement-bank-report-usecase-ready';

  const { data: currencyList } = useGetParticipantCurrencyList();
  // Redux
  const user = useGetUserState();
  const toast = useToast();
  const { t } = useTranslation();
  const { start, complete } = useLoadingContext();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'SettlementBankReport_UseCase',
    (_fileName) => {
      if (!toast.isActive(readyToastId)) {
        toast({
          id: readyToastId,
          position: 'top',
          description: `Your Settlement Bank Report UseCase is ready.`,
          status: 'success',
          isClosable: true,
          duration: 5000,
        });
      }
    },
    (error: IApiErrorResponse) => {
      toast({
        position: 'top',
        description: getErrorMessage(error) || 'Failed to request report',
        status: 'error',
        isClosable: true,
        duration: 10000,
      });
    }
  );

  const schema = settlementBankReportUseCase.schema;

  const {
    control,
    getValues,
    trigger,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<ISettlementBankReportUseCase>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      settlementId: '',
      currency: 'ALL',
      fileType: 'xlsx',
      timezoneOffset: '',
    },
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

    setSettlementIdOptions([]);
    setSettlementId('');
    setValue('settlementId', '');

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

    getSettlementIds(user, StartDate, EndDate,'', tzOffSet)
      .then((data: IGetSettlementIds) => {
        if (data.settlementIdDataList?.length === 0) {
          showDataNotFound(toast);
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
      .catch((error: IApiErrorResponse) => {
        if (error.error_code === REPORT_NOT_FOUND_ERROR) {
          showDataNotFound(toast);
          return;
        } else {
          toast({
            position: 'top',
            title: getErrorMessage(error),
            status: 'error',
            isClosable: true,
            duration: 3000
          })
        }
      })
      .finally(() => {
        setRunButtonState(true);
        complete();
      });
  }, [complete, getValues, start, toast, user,selectedTimezone]);

  const onSearchClick = useCallback(async () => {
    search();
  }, [search]);

  const onDownloadClick = async () => {
    if (!isValid) {
      toast({
        position: 'top',
        description: 'Please fill required fields before downloading.',
        status: 'warning',
        isClosable: true,
        duration: 2000,
      });
      return;
    }

    if (isDownloading) return;

    start();

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;

    try {
      const res = await generateSettlementBankReportUseCase(user, {
        settlementId: formData.settlementId,
        currencyId: formData.currency,
        timezoneOffset: moment().tz(selectedTZString).format('ZZ').replace('+', ''),
        fileType: fileType
      })

      const requestId = res?.requestId ?? res?.reqId ?? res?.reportRequestId;

      if (typeof requestId === 'string' && requestId.length > 0) {
        startPolling(requestId, fileType);
      } else {
        toast({
          position: 'top',
          description: 'No request ID returned from server',
          status: 'error',
          isClosable: true,
          duration: 3000,
        });
      }
    } catch (error: any) {
      if (error.error_code === REPORT_NOT_FOUND_ERROR) {
        showDataNotFound(toast);
      } else {
        toast({
          position: 'top',
          description: getErrorMessage(error) || 'Failed to request report',
          status: 'error',
          isClosable: true,
          duration: 3000,
        });
      }
    } finally {
      complete();
    }
  };

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;

    generateSettlementBankReportUseCase(user, {
      settlementId: formData.settlementId,
      currencyId: formData.currency,
      timezoneOffset: moment().tz(selectedTZString).format('ZZ').replace('+', ''),
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
        if (error.error_code === REPORT_NOT_FOUND_ERROR) {
          showDataNotFound(toast);
          return;
        } else {
          toast({
            position: 'top',
            description: getErrorMessage(error) || t('ui.failed_to_download'),
            status: 'error',
            isClosable: true,
            duration: 3000
          })
        }
      })
      .finally(() => {
        complete();
        setRunButtonState(true);
      });
  };

  return (

    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Stack>
        <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.settlement_bank_report_usecase')}</Heading>
      </Stack>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
          pb={2}
        >
          <FormControl
            isInvalid={!isEmpty(errors.startDate)} position="relative" pb={3}
          >
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <CustomDateTimePicker
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("endDate");
                    setSettlementIdOptions([]);
                    setSettlementId("");
                  }}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.endDate)} position="relative" pb={3}
          >
            <FormLabel>{t('ui.end_date')}</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field }) => (
                <CustomDateTimePicker
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger("startDate");
                    setSettlementIdOptions([]);
                    setSettlementId("");
                  }}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
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
              mb={2}
              w={{ base: "100%", md: "50%" }}
            >{t('ui.search_button')}</Button>
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
            <FormLabel>{t('ui.settlement_id')}:</FormLabel>
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
                  placeholder={t('ui.select_settlement_id')}
                />

              )}
            />
          </FormControl>

          <FormControl
            w="100%"
            isInvalid={!isEmpty(errors.currency)}
          >
            <FormLabel>{t('ui.currency')}</FormLabel>
            <Controller
              name="currency"
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
                  placeholder={t('ui.select_currency')}
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
                  placeholder={t('ui.choose_format')}
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
              onClick={onDownloadClick}
              isDisabled={!settlementId || isDownloading}
              isLoading={isDownloading}
              loadingText="Download"
              w={{ base: "100%", md: "50%" }}
            >{t('ui.download')}</Button>
          </FormControl>
        </SimpleGrid>
      </Stack>
      )
      }

      {isDownloading && (
        <HStack
          w="full"
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.200"
          borderRadius="md"
          px={4}
          py={3}
          spacing={3}
        >
          <Spinner size="sm" color="blue.500" flexShrink={0} />
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="blue.700">
              {statusLabel[downloadStatus] ?? 'Processing...'}
            </Text>
            <Text fontSize="xs" color="blue.500">
              You can leave this page. Your report will be available here once it’s ready.
            </Text>
          </Box>
        </HStack>
      )}

      {readyFile && (
        <HStack
          w="full"
          bg="green.50"
          borderWidth="1px"
          borderColor="green.200"
          borderRadius="md"
          px={4}
          py={3}
          spacing={3}
          justify="space-between"
        >
          <HStack spacing={3} overflow="hidden">
            <CheckCircleIcon color="green.500" boxSize={5} flexShrink={0} />
            <Box overflow="hidden">
              <Text fontSize="sm" fontWeight="semibold" color="green.700">
                Report ready
              </Text>
              <Text fontSize="xs" color="green.600" noOfLines={1} title={readyFile.fileName}>
                {readyFile.fileName} - Link expires in 24 hours
              </Text>
            </Box>
          </HStack>
          <Button
            size="sm"
            colorScheme="green"
            flexShrink={0}
            onClick={consumeDownload}
          >
            Click to Download
          </Button>
        </HStack>
      )}

      {downloadStatus === 'FAILED' && failedMessage && (
        <HStack
          w="full"
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="md"
          px={4}
          py={3}
          spacing={3}
          justify="space-between"
        >
          <HStack spacing={3} overflow="hidden">
            <WarningIcon color="red.500" boxSize={5} flexShrink={0} />
            <Box overflow="hidden">
              <Text fontSize="sm" fontWeight="semibold" color="red.700">
                Report generation failed
              </Text>
              <Text fontSize="xs" color="red.600" noOfLines={2} title={failedMessage}>
                {failedMessage}
              </Text>
            </Box>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            flexShrink={0}
            onClick={clearDownloadState}
          >
            OK
          </Button>
        </HStack>
      )}
    </VStack >
  );
};

export default memo(SettlementBankReportUseCase);
