import {
  Button, FormControl, FormErrorMessage, FormLabel, HStack, Heading,
  Input, Stack,
  Spinner,
  Text,
  VStack, SimpleGrid,
  useToast,
  Box
} from "@chakra-ui/react";
import { useLoadingContext } from "@contexts/hooks";
import { SettlementStatementReportHelper } from "@helpers/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { downloadFile, generateSettlementStatementReport } from "@services/report";

import { useGetUserState } from '@store/hooks'
import { type ISettlementStatementReport } from '@typescript/form/report'

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
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from "@helpers";
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useReportDownloadState } from '@hooks/useReportDownloadState';

const settlementStatementReportHelper = new SettlementStatementReportHelper()
const initialFileName = 'DFSPSettlementStatementReport'

const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const SettlementStatementReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const { t } = useTranslation();
  const [runButtonState, setRunButtonState] = useState(true);
  const readyToastId = 'dfsp-settlement-statement-report-ready';

  const { data: participantList } = useGetParticipantList();

  // Redux
  const user = useGetUserState()
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'DFSPSettlementStatementReport',
    (_fileName) => {
      if (!toast.isActive(readyToastId)) {
        toast({
          id: readyToastId,
          position: 'top',
          description: `Your DFSP Settlement Statement Report is ready.`,
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

  const { data: currencyList } = useGetParticipantCurrencyList();

  const isHubUser =
    typeof user.data?.participantName === 'string' &&
    user.data.participantName.toLowerCase() === 'hub';

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

    let tzOffSet: string = moment().tz(selectedTZString).format('ZZ').replace('+', '');

    try {
      const res = await generateSettlementStatementReport(user, {
        startDate: StartDate,
        endDate: EndDate,
        timezoneOffset: tzOffSet,
        fileType: fileType,
        fspId: isHubUser ? formData.fspId : user?.data?.participantName,
        currencyId: formData.currencyId
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
    start()

    const formData = getValues();
    const fileType = formData.fileType;

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
      .format('YYYY-MM-DDTHH:mm:ss[Z]');

    let tzOffSet: string = moment().tz(selectedTZString).format('ZZ').replace('+', '');

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
          showDataNotFound(toast);
        }
      }).catch((error: IApiErrorResponse) => {
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
      }).finally(() => {
        setRunButtonState(true);
        complete()
      })
  }

  const { control, trigger, setValue, getValues, formState: { errors, isValid } } = useForm<ISettlementStatementReport>({
    resolver: zodResolver(settlementStatementReportHelper.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      fspId: 'ALL',
      currencyId: 'ALL',
      fileType: 'xlsx'
    },
    mode: 'onChange'
  })

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  return (

    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        {t('ui.settlement_statement_report')}</Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
        >
          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>{t('ui.dfsp_name')}</FormLabel>

            {isHubUser ? (
              <Controller
                name="fspId"
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
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange, onBlur } }) => {
                return (
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('endDate');
                    }}
                    onBlur={onBlur}
                  />
                );
              }}
              name="startDate"
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.endDate)} pb="1">
            <FormLabel>{t('ui.end_date')}</FormLabel>
            <Controller
              control={control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error }
              }) => {
                return (
                  <CustomDateTimePicker
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('startDate');
                    }}
                    onBlur={onBlur}
                  />
                );
              }}
              name="endDate"
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
            <Button colorScheme='blue'
              flex={{ base: '1', md: '0 0 50%' }}
              isDisabled={!isValid || isDownloading}
              isLoading={isDownloading}
              loadingText="Download"
              onClick={onDownloadClick}
              w={{ base: "100%", sm: "auto" }}>{t('ui.download')}</Button>
          </FormControl>
        </SimpleGrid>
      </Stack>

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

export default memo(SettlementStatementReport)
