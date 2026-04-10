import { useEffect, memo, useState, useMemo } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  HStack,
  Spinner,
  Text,
  useToast,
  VStack,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { SettlementAuditReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementAuditReport,
} from '@services/report';

import { type ISettlementAuditReport } from '@typescript/form/report';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { Controller, useForm } from "react-hook-form";
import { useGetParticipantList } from '@hooks/services/participant';
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantCurrencyList } from '@hooks/services/participant';
import { type IApiErrorResponse } from "@typescript/services";
import { getErrorMessage } from "@helpers/errors";
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useReportDownloadState } from '@hooks/useReportDownloadState';

const settlementAuditReportHelper = new SettlementAuditReportHelper();
const initialFileName = 'SettlementAuditReport';

const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const SettlementAuditReport = () => {

  const toast = useToast();
  const { t } = useTranslation();
  const { start, complete } = useLoadingContext();
  const [runButtonState, setRunButtonState] = useState(true);
  const readyToastId = 'settlement-audit-report-ready';

  // custom hooks
  const { data: currencyList } = useGetParticipantCurrencyList();
  const { data: participantList } = useGetParticipantList();

  // Redux

  // Selected timezone
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'SettlementAuditReport',
    (_fileName) => {
      if (!toast.isActive(readyToastId)) {
        toast({
          id: readyToastId,
          position: 'top',
          description: `Your Settlement Audit Report is ready.`,
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

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm<ISettlementAuditReport>({
    resolver: zodResolver(settlementAuditReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      dfspId: 'ALL',
      currencyId: 'ALL',
      fileType: 'xlsx',
      timezoneOffset: ''
    },
    mode: 'onChange'
  });
  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  /* Handlers */

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

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');


    try {
      const res = await generateSettlementAuditReport({
        ...formData,
        startDate: StartDate,
        endDate: EndDate,
        timezoneOffset: tzOffSet
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

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    generateSettlementAuditReport({
      ...formData,
      startDate: StartDate,
      endDate: EndDate,
      timezoneOffset: tzOffSet
    })
      .then((res: any) => {
        if (res?.rptByte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.rptByte);
        } else {
          showDataNotFound(toast);
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
          });
        }

      })
      .finally(() => {
        complete();
        setRunButtonState(true);
      });
  };


  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        {t('ui.settlement_audit_report')}
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.dfspId)}>
            <FormLabel>{t('ui.dfsp_name')}</FormLabel>
            <Controller
              name="dfspId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  includeAllOption={true}
                  placeholder={t('ui.select_dfsp')}
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
            <FormErrorMessage>{errors.dfspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.startDate)}>
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("endDate");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)}>
            <FormLabel>{t('ui.end_date')}</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value);
                    trigger("startDate");
                  }}
                />
              )}
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.currencyId)}>
            <FormLabel>{t('ui.currency')}</FormLabel>
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
                  placeholder={t('ui.select_currency')}
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
                  placeholder={t('ui.choose_format')}
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
            <Button
              flex={{ base: '1', md: '0 0 50%' }}
              colorScheme="blue"
              isDisabled={!isValid || isDownloading}
              isLoading={isDownloading}
              loadingText="Download"
              onClick={onDownloadClick}
              w={{ base: "100%", sm: "auto" }}
            >{t('ui.download')}</Button>
          </FormControl>
        </SimpleGrid>

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

      </Stack>
    </VStack>
  );
};

export default memo(SettlementAuditReport);
