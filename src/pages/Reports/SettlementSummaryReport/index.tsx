import {
    Box,
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
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementSummaryReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateSettlementReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementSummaryReport } from '@typescript/form/report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { useMemo, useEffect, memo, useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';
import { useGetParticipantCurrencyList } from '@hooks/services';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { showDataNotFound } from '@utils';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useReportDownloadState } from '@hooks/useReportDownloadState';

const settlementSummaryReportHelper = new SettlementSummaryReportHelper();
const initialFileName = 'DFSPSettlementReport';

const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const SettlementSummaryReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const { t } = useTranslation();
  const [runButtonState, setRunButtonState] = useState(true);
  const readyToastId = 'dfsp-settlement-report-ready';
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);

  // Redux
  const { data: currencyList } = useGetParticipantCurrencyList();

  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );

  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'DFSPSettlementReport',
    (_fileName) => {
      if (!toast.isActive(readyToastId)) {
        toast({
          id: readyToastId,
          position: 'top',
          description: `Your DFSP Settlement Report is ready.`,
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

  const user = useGetUserState();
  const { data: participantList } = useGetParticipantList();

  const [settlementId, setSettlementId] = useState("");

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
      fspId: '',
      settlementId: '',
      currencyId: 'all',
      fileType: 'xlsx',
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
    },
    mode: 'onChange'
  });

  const fspIdValue = useWatch({
    control,
    name: 'fspId',
  });

  const currentParticipantDfspId = useMemo(() => {
    const foundParticipant = participantList?.find(
      participant => participant.participantName === fspIdValue
    );
    
    const dfspId = foundParticipant?.dfspId;
    return dfspId ? String(dfspId) : '';
  }, [fspIdValue, participantList]);

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setSettlementIdOptions([]);
    setSettlementId('');
    setValue('settlementId', '');

  }, [selectedTimezone, setValue]);

  useEffect(() => {
    if (isHubUser) {
      setValue('fspId', '');
    } else {
      const participantName = user?.data?.participantName || '';
      setValue('fspId', participantName);
    }
  }, [isHubUser, user, setValue]);

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

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    try {
      const res = await generateSettlementReport({
        settlementId: formData.settlementId,
        currencyId: formData.currencyId,
        fspId: isHubUser ? formData.fspId : user?.data?.participantName,
        fileType: fileType,
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

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const formData = getValues();

    const StartDate = moment.tz(formData.startDate, selectedTimezone?.value)
    .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const EndDate = moment.tz(formData.endDate, selectedTimezone?.value)
    .format('YYYY-MM-DDTHH:mm:ss[Z]');

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value).format('ZZ').replace('+', '');

    getSettlementIds(user, StartDate, EndDate, currentParticipantDfspId, tzOffSet)
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
      .catch((error: IApiErrorResponse) => {
        toast({
          position: 'top',
          title: getErrorMessage(error),
          status: 'error',
          isClosable: true,
          duration: 3000
        });
      })
      .finally(() => {
        setRunButtonState(true);
        complete();
      });
  }, [complete, getValues, start, toast, user, selectedTimezone, currentParticipantDfspId]);

  const onSearchClick = useCallback(() => {
    search();
  },
    [search]
  );

  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
{t('ui.settlement_summary_report')}
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
          pb={2}
        >

          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>{t('ui.dfsp_name')}</FormLabel>

            {isHubUser ? (
              <Controller
                name="fspId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    isClearable
                    placeholder={t('ui.select_dfsp')}
                    options={
                      (participantList ?? []).map(
                        (item): OptionType => ({
                          value: item.participantName,
                          label: item.description ? `${item.participantName} (${item.description})` : item.participantName,
                        })
                      )
                    }
                    value={
                      field.value
                        ? {
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
                      setSettlementIdOptions([]);
                      setSettlementId("");
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
                    setSettlementIdOptions([]);
                    setSettlementId("");
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
                    setSettlementIdOptions([]);
                    setSettlementId("");
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
            mb={1}
          >
            <Button
              onClick={handleSubmit(onSearchClick)}
              isDisabled={!currentParticipantDfspId || !isValid}
              colorScheme="blue"
              gap="2"
              size="md"
              mb={2}
              w={{ base: "100%", md: "50%" }}
            >{t('ui.search_button')}</Button>
          </FormControl>
        </SimpleGrid>
      </Stack>

      {settlementIdOptions.length > 0 && (
        <Stack borderWidth="1px" borderRadius="lg" p={4} w="full" spacing={4}>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 4 }}
            spacing={4}
            w="full"
          >
            <FormControl isInvalid={!isEmpty(errors.settlementId)}
              w="100%">
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

            <FormControl w="100%" mt={8} >
              <Controller
                control={control}
                name="fileType"
                render={({ field }) => (
                  <CustomSelect
                    options={[
                      { value: 'xlsx', label: 'XLSX' },
                      { value: 'pdf', label: 'PDF' },
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
            <FormControl w="100%"
              display="flex"
              justifyContent={{ base: "stretch", md: "flex-end" }}
              alignItems="flex-end"
              mt="5px"
            >
              <Button
                flex={{ base: '1', md: '0 0 50%' }}
                colorScheme="blue"
                isDisabled={!fspIdValue || !settlementId || isDownloading}
                isLoading={isDownloading}
                loadingText="Download"
                onClick={onDownloadClick}
              >{t('ui.download')}</Button>
            </FormControl>
          </SimpleGrid>

        </Stack>
      )}

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

    </VStack>
  );
};

export default memo(SettlementSummaryReport);
