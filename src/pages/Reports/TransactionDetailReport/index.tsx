import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Spinner,
  Text,
  Stack,
  useToast,
  VStack,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { TransactionDetailReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateTransactionDetailReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ITransactionDetailReport } from '@typescript/form/report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { useMemo, useEffect, memo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';
import { useGetParticipantCurrencyList, useGetAllTransferStates } from '@hooks/services';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';
import { useReportDownloadState } from '@hooks/useReportDownloadState';


const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const transactionDetailReportHelper = new TransactionDetailReportHelper();
const initialFileName = 'TransactionDetailReport';

const TransactionDetailReport = () => {
  const tranStateRes = useGetAllTransferStates();
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const { t } = useTranslation();
  const [runButtonState, setRunButtonState] = useState(true);
  const readyToastId = 'transaction-detail-report-ready';

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );
  const user = useGetUserState();
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
  } = useForm<ITransactionDetailReport>({
    resolver: zodResolver(transactionDetailReportHelper.schema),
    defaultValues: {
      state: 'ALL',
      fileType: 'xlsx',
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    },
    mode: 'onChange'
  });



  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

  }, [selectedTimezone, setValue]);

  /* Handlers */
  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'TransactionDetailReport',
    (_fileName) => {
      if (!toast.isActive(readyToastId)) {
        toast({
          id: readyToastId,
          position: 'top',
          title: 'Report ready',
          description: 'Your report is ready. Click the download link to save the file.',
          status: 'success',
          isClosable: true,
          duration: 5000,
        });
      }
    },
    (error: IApiErrorResponse) => {
      if (error.error_code === REPORT_NOT_FOUND_ERROR) {
        showDataNotFound(toast);
        return;
      }

      toast({
        position: 'top',
        description: getErrorMessage(error) || 'Failed to request report',
        status: 'error',
        isClosable: true,
        duration: 10000,
      });

      clearDownloadState();

    }
  );

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
      const res = await generateTransactionDetailReport(user, {
        startDate: StartDate,
        endDate: EndDate,
        state: formData.state,
        fileType: fileType,
        timezoneOffset: tzOffSet,
        dfspId: isHubUser ? 'all' : user?.data?.participantName
      });

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

    let tzOffSet: string = moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateTransactionDetailReport(user, {
      startDate: StartDate,
      endDate: EndDate,
      state: formData.state,
      fileType: fileType,
      timezoneOffset: tzOffSet,
      dfspId: isHubUser ? 'all' : user?.data?.participantName
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
        setRunButtonState(true);
        complete();
      });
  };

  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        {t('ui.transaction_detail_report')}
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
          pb={2}
        >
          <FormControl isInvalid={!isEmpty(errors.startDate)} position="relative" pb={3}>
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("endDate");
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} position="relative" pb={3}>
            <FormLabel>{t('ui.end_date')}</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <CustomDateTimePicker
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("startDate");
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.state)}>
            <FormLabel>{t('ui.status')}</FormLabel>
            <Controller
              control={control}
              name="state"
              render={({ field }) => (
                <CustomSelect
                  isMulti={false}
                  includeAllOption={true}
                  maxMenuHeight={300}
                  placeholder={t('ui.transfer_state')}
                  options={tranStateRes?.data?.transferStateInfoList?.map((item) => ({
                    value: item.transferStateId,
                    label: item.transferState
                  })) || []}
                  value={field.value
                    ? {
                      value: field.value,
                      label: field.value
                    }
                    : null}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption?.value || '');
                  }}
                />
              )}
            />
          </FormControl>

          <FormControl w="100%" mt={8}>
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

        </SimpleGrid>

        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">
          <Box />
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
              isDisabled={isDownloading}
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

export default memo(TransactionDetailReport);
