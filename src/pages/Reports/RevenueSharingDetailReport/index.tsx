// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';
import { OptionType } from '@components/interface/CustomSelect';
import { PreventableButton } from '@components/interface/PreventableButton';
import { useLoadingContext } from '@contexts/hooks';
import { REPORT_NOT_FOUND_ERROR } from '@helpers';
import { getErrorMessage } from '@helpers/errors';
import { SettlementBankReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetRevenueConfigList } from '@hooks/services/revenue-sharing';
import { useReportDownloadState } from '@hooks/useReportDownloadState';
import { downloadFile, getSettlementIds, generateRevenueSharingDetailReport } from '@services/report';
import { RootState } from '@store';
import { useGetUserState } from '@store/hooks';
import { ISettlementBankReport } from '@typescript/form/report';
import { IRevenueConfig } from '@typescript/services';
import { IApiErrorResponse } from '@typescript/services';
import { IGetSettlementIds } from '@typescript/services/report';
import { showDataNotFound } from '@utils';
import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ITimezoneOption } from 'react-timezone-select';

type RevenueSharingDetailReportForm = ISettlementBankReport & {
  category: string;
  taxCodeId: string;
};

const revenueSharingReport = new SettlementBankReportHelper();
const initialFileName = 'RevenueSharingDetailReport';

const statusLabel: Record<string, string> = {
  PENDING: 'Queuing report...',
  RUNNING: 'Generating report...',
  READY: 'Downloading...',
};

const RevenueSharingDetailReport = () => {
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [settlementId, setSettlementId] = useState('');
  const { data: revenueConfigs } = useGetRevenueConfigList();
  const user = useGetUserState();
  const toast = useToast();
  const { t } = useTranslation();
  const { start, complete } = useLoadingContext();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>((state) => state.app.selectedTimezone);

  const selectedTZString = useMemo(() => selectedTimezone.value, [selectedTimezone]);


  const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
    'RevenueSharingDetailReport',
    () => {},
    () => {}
  );

  const {
    control,
    getValues,
    trigger,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<RevenueSharingDetailReportForm>({
    resolver: zodResolver(revenueSharingReport.schema),
    defaultValues: {
      startDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      endDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
      settlementId: '',
      currency: 'ALL',
      fileType: 'xlsx',
      timezoneOffset: '',
      category: 'ALL',
      taxCodeId: 'ALL',
    },
    mode: 'onChange'
  });

  const selectedCategory = watch('category');

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set((revenueConfigs ?? []).map((config: IRevenueConfig) => config.category).filter(Boolean)));
    return [
      { value: 'ALL', label: 'ALL' },
      ...categories.map((category) => ({ value: String(category), label: String(category).replace(/_/g, ' ') }))
    ];
  }, [revenueConfigs]);

  const taxCodeOptions = useMemo(() => {
    const configs = (revenueConfigs ?? []).filter((config: IRevenueConfig) =>
      !selectedCategory || selectedCategory === 'ALL' || config.category === selectedCategory
    );
    return [
      { value: 'ALL', label: t('ui.all_codes') },
      ...configs.map((config: IRevenueConfig) => ({
        value: config.taxCodeId,
        label: `${config.taxCodeId} - ${config.taxCodeDescription}`
      }))
    ];
  }, [revenueConfigs, selectedCategory, t]);

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setValue('endDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));
    setSettlementIdOptions([]);
    setSettlementId('');
    setValue('settlementId', '');
    setValue('category', 'ALL');
    setValue('taxCodeId', 'ALL');
  }, [selectedTZString, setValue]);

  const search = useCallback(() => {
    start();
    const values = getValues();
    const startDate = moment.tz(values.startDate, selectedTimezone.value).format('YYYY-MM-DDTHH:mm:ss[Z]');
    const endDate = moment.tz(values.endDate, selectedTimezone.value).format('YYYY-MM-DDTHH:mm:ss[Z]');
    const timezoneOffset = selectedTimezone.offset === 0 ? '0000' : moment().tz(selectedTimezone.value).format('ZZ').replace('+', '');

    getSettlementIds(user, startDate, endDate, '', timezoneOffset)
      .then((data: IGetSettlementIds) => {
        if (data.settlementIdDataList?.length === 0) {
          showDataNotFound(toast);
        }

        const options = data.settlementIdDataList.map((item) => ({ value: item.settlementId, label: item.settlementId }));
        setSettlementIdOptions(options);
        setSettlementId('');
        setValue('settlementId', '');
        setValue('fileType', 'xlsx');
      })
      .catch((error: IApiErrorResponse) => {
        if (error.error_code === REPORT_NOT_FOUND_ERROR) {
          showDataNotFound(toast);
          return;
        }

        toast({
          position: 'top',
          title: getErrorMessage(error),
          status: 'error',
          isClosable: true,
          duration: 3000
        });
      })
      .finally(complete);
  }, [complete, getValues, selectedTimezone, setValue, start, toast, user]);

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

    try {
      const res = await generateRevenueSharingDetailReport(user, {
        settlementId: formData.settlementId,
        category: formData.category,
        taxCodeId: formData.taxCodeId,
        timezoneOffset: moment().tz(selectedTimezone.value).format('ZZ').replace('+', ''),
        fileType
      });

      const requestId = res?.requestId ?? res?.reqId ?? res?.reportRequestId;

      if (typeof requestId === 'string' && requestId.length > 0) {
        startPolling(requestId, fileType);
      } else if (res?.rptByte?.length > 0) {
        downloadFile(initialFileName, fileType, res.rptByte);
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
          description: getErrorMessage(error) || t('ui.failed_to_download'),
          status: 'error',
          isClosable: true,
          duration: 3000,
        });
      }
    } finally {
      complete();
    }
  };

  return (
    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Stack>
        <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.revenue_sharing_detail_report')}</Heading>
      </Stack>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} w="full" pb={2}>
          <FormControl isInvalid={!isEmpty(errors.startDate)} position="relative" pb={3}>
            <FormLabel>{t('ui.start_date')}</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <CustomDateTimePicker
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                    trigger('endDate');
                    setSettlementIdOptions([]);
                    setSettlementId('');
                  }}
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
              render={({ field }) => (
                <CustomDateTimePicker
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                    trigger('startDate');
                    setSettlementIdOptions([]);
                    setSettlementId('');
                  }}
              />
              )}
            />
            <FormErrorMessage pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <Box />
          <FormControl display="flex" justifyContent={{ base: 'stretch', md: 'flex-end' }} alignItems="flex-end" mb={1}>
            <Button onClick={handleSubmit(search)} isDisabled={!isValid} colorScheme="blue" gap="2" size="md" mb={2} w={{ base: '100%', md: '50%' }}>
              {t('ui.search_button')}
            </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>

      {settlementIdOptions.length > 0 && (
        <Stack borderWidth="1px" w="full" borderRadius="lg" p={4} spacing={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
            <FormControl w="100%" isInvalid={!isEmpty(errors.settlementId)}>
              <FormLabel>{t('ui.settlement_id')}:</FormLabel>
              <Controller
                name="settlementId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    maxMenuHeight={300}
                    isClearable={true}
                    options={settlementIdOptions}
                    value={field.value ? { value: field.value, label: settlementIdOptions.find((option) => option.value === field.value)?.label || '' } : null}
                    onChange={(selected: OptionType | null) => {
                      field.onChange(selected?.value || '');
                      setSettlementId(selected?.value || '');
                    }}
                    placeholder={t('ui.select_settlement_id')}
                  />
                )}
              />
            </FormControl>



            <FormControl w="100%">
              <FormLabel>{t('ui.category')}</FormLabel>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    maxMenuHeight={300}
                    isClearable={false}
                    options={categoryOptions}
                    value={categoryOptions.find((option) => option.value === field.value) || null}
                    onChange={(selected: OptionType | null) => {
                      field.onChange(selected?.value || 'ALL');
                      setValue('taxCodeId', 'ALL');
                    }}
                    placeholder={t('ui.category')}
                  />
                )}
              />
            </FormControl>

            <FormControl w="100%">
              <FormLabel>{t('ui.tax_code')}</FormLabel>
              <Controller
                  name="taxCodeId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    maxMenuHeight={300}
                    isClearable={false}
                    options={taxCodeOptions}
                    value={taxCodeOptions.find((option) => option.value === field.value) || null}
                    onChange={(selected: OptionType | null) => field.onChange(selected?.value || 'ALL')}
                    placeholder={t('ui.tax_code')}
                  />
                )}
              />
              </FormControl>

            <FormControl w="100%">
              <FormLabel>{t('ui.choose_format')}</FormLabel>
              <Controller
                control={control}
                name="fileType"
                render={({ field }) => (
                  <CustomSelect
                    options={[{ value: 'xlsx', label: 'XLSX' }, { value: 'pdf', label: 'PDF' }]}
                    value={field ? { value: field.value, label: field.value.toUpperCase() } : null}
                    onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                    placeholder={t('ui.choose_format')}
                  />
                )}
              />
            </FormControl>
          </SimpleGrid>

          <HStack w="full" justify="flex-end">
            <Button colorScheme="blue" onClick={onDownloadClick} isDisabled={!settlementId || isDownloading} isLoading={isDownloading} loadingText="Download" w={{ base: '100%', md: '180px' }}>
              {t('ui.download')}
            </Button>
          </HStack>
        </Stack>
      )}

      {isDownloading && (
        <HStack w="full" bg="blue.50" borderWidth="1px" borderColor="blue.200" borderRadius="md" px={4} py={3} spacing={3}>
          <Spinner size="sm" color="blue.500" flexShrink={0} />
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="blue.700">{statusLabel[downloadStatus] ?? 'Processing...'}</Text>
            <Text fontSize="xs" color="blue.500">You can leave this page. Your report will be available here once it is ready.</Text>
          </Box>
        </HStack>
      )}

      {readyFile && (
        <HStack w="full" bg="green.50" borderWidth="1px" borderColor="green.200" borderRadius="md" px={4} py={3} spacing={3} justify="space-between">
          <HStack spacing={3} overflow="hidden">
            <CheckCircleIcon color="green.500" boxSize={5} flexShrink={0} />
            <Box overflow="hidden">
              <Text fontSize="sm" fontWeight="semibold" color="green.700">Report ready</Text>
              <Text fontSize="xs" color="green.600" noOfLines={1} title={readyFile.fileName}>{readyFile.fileName} - Link expires in 24 hours</Text>
            </Box>
          </HStack>
          <PreventableButton size="sm" colorScheme="green" flexShrink={0} onClick={consumeDownload}>Click to Download</PreventableButton>
        </HStack>
      )}

      {downloadStatus === 'FAILED' && failedMessage && (
        <HStack w="full" bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md" px={4} py={3} spacing={3} justify="space-between">
          <HStack spacing={3} overflow="hidden">
            <WarningIcon color="red.500" boxSize={5} flexShrink={0} />
            <Box overflow="hidden">
              <Text fontSize="sm" fontWeight="semibold" color="red.700">Report generation failed</Text>
              <Text fontSize="xs" color="red.600" noOfLines={2} title={failedMessage}>{failedMessage}</Text>
            </Box>
          </HStack>
          <Button size="sm" variant="outline" colorScheme="red" flexShrink={0} onClick={clearDownloadState}>OK</Button>
        </HStack>
      )}
    </VStack>
  );
};

export default memo(RevenueSharingDetailReport);
