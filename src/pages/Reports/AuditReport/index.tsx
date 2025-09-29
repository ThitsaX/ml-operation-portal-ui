import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Input,
    useToast,
    Select,
    Stack
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

const auditHelper = new AuditReportHelper();

const AuditReport = () => {
    const toast = useToast();

    const { start, complete } = useLoadingContext();
    const [runButtonState, setRunButtonState] = useState(true);
    const initialFileName = 'Audit-Report';

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
            participantId: user?.participantId,
            fromDate: moment().format('YYYY-MM-DDTHH:mm'),
            toDate: moment().format('YYYY-MM-DDTHH:mm'),
            userId: '',
            action: '',
            fileType: '',
            timezoneOffset: ''
        },
        resolver: zodResolver(auditHelper.schema),
        mode: 'onChange'
    });

    useEffect(() => {
        if (user?.participantId) {
            setValue('participantId', user.participantId);
        }
    }, [user?.participantId, setValue]);

    // Handler
    const onDownloadChangeHandler = (e: any) => {
        start();
        setRunButtonState(false);

        const formData = getValues();
        const fileType = formData.fileType;
        const currentTimeZone = moment.tz.guess();

        // Convert to UTC
        const utcFromDate = moment(formData.fromDate)
            .tz(selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const utcToDate = moment(formData.toDate)
            .tz(selectedTimezone?.value || currentTimeZone)
            .utc()
            .format('YYYY-MM-DDTHH:mm:ss[Z]');

        const tzOffSet = selectedTimezone?.offset === 0
            ? '0000'
            : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

        generateAuditReport({
            ...formData,
            fromDate: utcFromDate,
            toDate: utcToDate,
            participantId: user?.participantId,
            timezoneOffset: tzOffSet
        })
            .then((res: any) => {
                if (res?.generated?.length > 0) {
                    downloadFile(initialFileName, fileType, res?.generated);
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
            .catch((e) => {
                console.log(e);
            })
            .finally(() => {
                complete();
                setRunButtonState(true);
            });
    };

    return (
        <Box height="fit" p="4">
            <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
                AuditReport
            </Heading>

            <Stack borderWidth="1px" borderRadius="lg" height="full" p="4" spacing={4}>
                <HStack alignItems={'flex-start'} spacing={4}>

                    <FormControl isInvalid={!isEmpty(errors.fromDate)}>
                        <FormLabel>Start Date</FormLabel>
                        <Controller
                            control={control}
                            name="fromDate"
                            render={({ field: { value, onChange } }) => (
                                <Input
                                    type="datetime-local"
                                    value={value}
                                    onChange={(e) => {
                                    onChange(e.target.value);
                                    trigger('toDate');
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
                                <Input
                                    type="datetime-local"
                                    value={value}
                                    onChange={(e) => {
                                    onChange(e.target.value);
                                    trigger('fromDate');
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
                            name="action"
                            render={({ field }) => (
                                <Select {...field} placeholder="All">
                                    {actionList?.map((item) => (
                                        <option key={item.actionId} value={item.actionName}>
                                            {item.actionName}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>MadeBy</FormLabel>
                        <Controller
                            control={control}
                            name="userId"
                            render={({ field }) => (
                                <Select {...field} placeholder="All">
                                    {userList?.map((user) => (
                                        <option key={user.userId} value={user.userId}>
                                            {user.email}
                                        </option>
                                    ))}
                                </Select>
                            )}
                        />
                    </FormControl>
                </HStack>
                <HStack width="100%" justifyContent="flex-end" spacing={4}>
                    <FormControl width="250px">
                        <Controller
                            control={control}
                            name="fileType"
                            render={({ field }) => (
                                <Select {...field} placeholder="Choose Format" width="250px">
                                    <option value="xlsx">XLSX</option>
                                    <option value="csv">CSV</option>
                                </Select>
                            )}
                        />
                    </FormControl>
                    <Button
                        colorScheme='blue'
                        isDisabled={!isValid || !runButtonState}
                        onClick={onDownloadChangeHandler}
                    >
                        Download
                    </Button>
                </HStack>
            </Stack>
        </Box>
    );
};

export default AuditReport;
