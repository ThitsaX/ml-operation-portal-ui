import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Spinner,
    Text,
    Input,
    useToast,
    Stack,
    VStack,
    SimpleGrid
} from '@chakra-ui/react';
import { useLoadingContext } from '@contexts/hooks';
import { AuditReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetActionList, useGetMadeByList } from '@hooks/services';
import { useGetUserState } from '@store/hooks';
import { IGetAuditReport } from '@typescript/form';
import moment from 'moment';
import { useEffect, useState, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { isEmpty } from 'lodash-es';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { ITimezoneOption } from 'react-timezone-select';
import { downloadFile, generateAuditReport } from '@services/report';
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

const auditHelper = new AuditReportHelper();
const initialFileName = 'AuditReport';

const statusLabel: Record<string, string> = {
    PENDING: 'Queuing report...',
    RUNNING: 'Generating report...',
    READY: 'Downloading...',
};

const AuditReport = () => {
    const toast = useToast();
  const { t } = useTranslation();

    const { start, complete } = useLoadingContext();
    const [runButtonState, setRunButtonState] = useState(true);
    const readyToastId = 'audit-report-ready';

    /* Redux */
    const { data: user } = useGetUserState();

    /* Selected timezone */
    const selectedTimezone = useSelector<RootState, ITimezoneOption>(
        (s) => s.app.selectedTimezone
    );

    const selectedTZString = useMemo(
        () => (selectedTimezone.value),
        [selectedTimezone]
    );

    const { downloadStatus, isDownloading, readyFile, failedMessage, startPolling, consumeDownload, clearDownloadState } = useReportDownloadState(
        'AuditReport',
        (_fileName) => {
            if (!toast.isActive(readyToastId)) {
                toast({
                    id: readyToastId,
                    position: 'top',
                    description: `Your Audit Report is ready.`,
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

    /* React Query */
    const { data: userList } = useGetMadeByList();
    const { data: actionList } = useGetActionList();

    /* Hook Form */
    const {
        control,
        handleSubmit,
        trigger,
        formState: { isValid, errors, defaultValues },
        getValues,
        setValue,
        reset
    } = useForm<IGetAuditReport>({
        defaultValues: {
            fromDate: moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            toDate: moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            userId: '',
            actionId: '',
            fileType: 'xlsx',
            timezoneOffset: ''
        },
        resolver: zodResolver(auditHelper.schema),
        mode: 'onChange'
    });

    useEffect(() => {
        setValue('fromDate', moment().tz(selectedTZString).startOf('day').format('YYYY-MM-DDTHH:mm:ss'));
        setValue('toDate', moment().tz(selectedTZString).endOf('day').format('YYYY-MM-DDTHH:mm:ss'));

    }, [selectedTimezone, user?.participantId, setValue]);

    // Handler

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

        const currentTimeZone = moment.tz.guess();

        // Interpret input as selected timezone, then convert to UTC
        const utcFromDate = moment.tz(formData.fromDate, selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const utcToDate = moment.tz(formData.toDate, selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const tzOffSet = selectedTimezone?.offset === 0
            ? '0000'
            : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

        try {
            const res = await generateAuditReport({
                ...formData,
                fromDate: utcFromDate,
                toDate: utcToDate,
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
        const currentTimeZone = moment.tz.guess();

        // Interpret input as selected timezone, then convert to UTC
        const utcFromDate = moment.tz(formData.fromDate, selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const utcToDate = moment.tz(formData.toDate, selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const tzOffSet = selectedTimezone?.offset === 0
            ? '0000'
            : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

        generateAuditReport({
            ...formData,
            fromDate: utcFromDate,
            toDate: utcToDate,
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
{t('ui.audit_report')}
            </Heading>

            <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">

                <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 4 }}
                    spacing={4}
                    w="full"
                >
                    <FormControl isInvalid={!isEmpty(errors.fromDate)}>
                        <FormLabel>{t('ui.start_date')}</FormLabel>
                        <Controller
                            control={control}
                            name="fromDate"
                            render={({ field: { value, onChange } }) => (
                                <CustomDateTimePicker
                                    value={value}
                                    onChange={(e) => {
                                        onChange(e.target.value);
                                        trigger("toDate");
                                    }}
                                />
                            )}
                        />
                        <FormErrorMessage>{errors.fromDate?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!isEmpty(errors.toDate)}>
                        <FormLabel>{t('ui.end_date')}</FormLabel>
                        <Controller
                            control={control}
                            name="toDate"
                            render={({ field: { value, onChange } }) => (
                                <CustomDateTimePicker
                                    value={value}
                                    onChange={(e) => {
                                        onChange(e.target.value);
                                        trigger("fromDate");
                                    }}
                                />
                            )}
                        />
                        <FormErrorMessage>{errors.toDate?.message}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                        <FormLabel>{t('ui.action')}</FormLabel>
                        <Controller
                            control={control}
                            name="actionId"
                            render={({ field }) => (
                                <CustomSelect
                                    maxMenuHeight={300}
                                    isClearable={true}
                                    options={
                                        (actionList ?? []).map((item) => ({
                                            value: item.actionId,
                                            label: item.actionName,
                                        }))
                                    }
                                    value={
                                        field.value
                                            ? {
                                                value: field.value,
                                                label:
                                                    actionList?.find((a) => a.actionId === field.value)
                                                        ?.actionName || '',
                                            }
                                            : null
                                    }
                                    onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                                    placeholder={t('ui.all')}
                                />
                            )}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>{t('ui.made_by')}</FormLabel>
                        <Controller
                            control={control}
                            name="userId"
                            render={({ field }) => (
                                <CustomSelect
                                    maxMenuHeight={300}
                                    isClearable={true}
                                    options={
                                        (userList ?? []).map((item) => ({
                                            value: item.userId,
                                            label: item.email,
                                        }))
                                    }
                                    value={
                                        field.value
                                            ? {
                                                value: field.value,
                                                label:
                                                    userList?.find((a) => a.userId === field.value)
                                                        ?.email || '',
                                            }
                                            : null
                                    }
                                    onChange={(selected: OptionType | null) => field.onChange(selected?.value || '')}
                                    placeholder={t('ui.all')}
                                />
                            )}
                        />
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
        </VStack>
    );
};

export default AuditReport;
