import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  Box,
  VStack,
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementDetailReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementDetailReport,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementDetailReport } from '@typescript/form/report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { useMemo, memo, useEffect, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { OptionType } from '@components/interface/CustomSelect';
import { CustomSelect } from '@components/interface';
import { CustomDateTimePicker } from '@components/interface/CustomDateTimePicker';

const settlementDetailReportHelper = new SettlementDetailReportHelper();
const initialFileName = 'DFSPSettlementDetailReport';

const SettlementDetailReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);


  const [settlementId, setSettlementId] = useState("");
  const [fspId, setFspId] = useState("");


  // Redux
  const user = useGetUserState();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  const selectedTZString = useMemo(
    () => (selectedTimezone.value),
    [selectedTimezone]
  );
  const { data: participantList } = useGetParticipantList();

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
  } = useForm<ISettlementDetailReport>({
    resolver: zodResolver(settlementDetailReportHelper.schema),
    defaultValues: {
      fspId: '',
      settlementId: '',
      fileType: 'xlsx',
      startDate: moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'),
      endDate: moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'),
    },
    mode: 'onChange'
  });

  useEffect(() => {
    setValue('startDate', moment().tz(selectedTZString).subtract(1, 'days').format('YYYY-MM-DDTHH:mm'));
    setValue('endDate', moment().tz(selectedTZString).format('YYYY-MM-DDTHH:mm'));

  }, [selectedTimezone, setValue]);

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = formData.fileType;

    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementDetailReport({
      settlementId: formData.settlementId,
      fspId: isHubUser ? formData.fspId : user?.data?.participantName,
      fileType: fileType,
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
          status: 'warning',
          isClosable: true,
          duration: 3000
        });
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

  const onSearchClick = useCallback(() => {
    search();
  },
    [search]
  );



  return (
    <VStack align="flex-start" h="full" p="3" mt={10} w="full">
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>
        Settlement Detail Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full"
          pb={2}>

          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>DFSP Name</FormLabel>

            {isHubUser ? (
              <Controller
                name="fspId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    isClearable
                    placeholder="Select DFSP"
                    options={
                      (participantList ?? []).map(
                        (item): OptionType => ({
                          value: item.participantName,
                          label: item.participantName,
                        })
                      )
                    }
                    value={
                      field.value
                        ? {
                          value: field.value,
                          label:
                            participantList?.find(
                              (p) => p.participantName === field.value
                            )?.participantName || '',
                        }
                        : null
                    }
                    onChange={(selected: OptionType | null) => {
                      const value = selected?.value || '';
                      field.onChange(value);
                      setFspId(value);
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
            <FormLabel>Start Date</FormLabel>
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
            <FormErrorMessage  pb={1} position="absolute" bottom="-22px">{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} position="relative" pb={3}>
            <FormLabel>End Date</FormLabel>
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
            <FormErrorMessage  pb={1} position="absolute" bottom="-22px">{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

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
              mb={2}
            >
              Search
            </Button>
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
              w={{ base: "100%" }}>
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
            <Box />

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
                flex={{ base: '1', md: '0 0 50%' }}
                colorScheme="blue"
                isDisabled={!fspId || !settlementId || !runButtonState}
                onClick={onDownloadChangeHandler}
              >
                Download
              </Button>
            </FormControl>
          </SimpleGrid>
        </Stack>
      )}
    </VStack>
  );
};

export default memo(SettlementDetailReport);
