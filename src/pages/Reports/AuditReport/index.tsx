import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
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

const auditHelper = new AuditReportHelper();

const AuditReport = () => {
    const toast = useToast();

    const { start, complete } = useLoadingContext();
    const [runButtonState, setRunButtonState] = useState(true);
    const initialFileName = 'AuditReport';

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
                    status: 'error',
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
        <VStack align="flex-start" h="full" p="3" mt={10} w="full">
            <Heading fontSize="2xl" fontWeight="bold" mb={6}>
                Audit Report
            </Heading>

            <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">

                <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 4 }}
                    spacing={4}
                    w="full"
                >
                    <FormControl isInvalid={!isEmpty(errors.fromDate)}>
                        <FormLabel>Start Date</FormLabel>
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
                        <FormLabel>End Date</FormLabel>
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
                        <FormLabel>Action</FormLabel>
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
                                    placeholder="All"
                                />
                            )}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Made By</FormLabel>
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
                                    placeholder="All"
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
                        isDisabled={!isValid || !runButtonState}
                        onClick={onDownloadChangeHandler}
                        w={{ base: "100%", sm: "auto" }}
                    >
                        Download
                    </Button>
                    </FormControl>
                </SimpleGrid>
            </Stack>
        </VStack>
    );
};

export default AuditReport;
