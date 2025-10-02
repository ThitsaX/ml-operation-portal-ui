import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  useToast,
  HStack,
  VStack,
  Select,
  SimpleGrid
} from '@chakra-ui/react';
import { SettlementSummaryReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { downloadFile, generateSettlementDetailReport, getSettlementIds } from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementSummaryReport } from '@typescript/form/settlement-detail-report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaSearch } from "react-icons/fa";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetParticipantList } from '@hooks/services/participant';


const settlementSummaryReportHelper = new SettlementSummaryReportHelper();
const initialFileName = 'Settlement-Details-Report';

const SettlementSummaryReport = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const user = useGetUserState();
  const { data: participantList } = useGetParticipantList();

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm<ISettlementSummaryReport>({
    resolver: zodResolver(settlementSummaryReportHelper.schema),
    defaultValues: {
      startDate: moment().format('YYYY-MM-DDTHH:mm'),
      endDate: moment().format('YYYY-MM-DDTHH:mm')
    },
    mode: 'onChange'
  });

  /* Handlers */
  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const fileType = e.target.value;
    const currentTimeZone = moment.tz.guess();

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

    generateSettlementDetailReport({
      settlementId: selectedSettlementId?.value,
      fspId: formData.fspId,
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
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        complete();
      });
  };

  const search = useCallback(() => {
    start();
    setRunButtonState(false);

    const formData = getValues();
    const currentTimeZone = moment.tz.guess();

    // Convert to UTC
    const utcStartDate = moment(formData.startDate)
      .tz(selectedTimezone?.value || currentTimeZone)
      .utc()
      .format();

    const utcEndDate = moment(formData.endDate)
      .tz(selectedTimezone?.value || currentTimeZone)
      .utc()
      .format();

    const tzOffSet = selectedTimezone?.offset === 0
      ? '0000'
      : moment().tz(selectedTimezone?.value || currentTimeZone).format('ZZ').replace('+', '');

    getSettlementIds(user, utcStartDate, utcEndDate, tzOffSet)
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

        setSelectedSettlementId(null);
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
      <Heading fontSize="2xl" mb={6}>
        Settlement Summary Report
      </Heading>

      <Stack borderWidth="1px" borderRadius="lg" p={4} spacing={6} w="full">
        {/* --- Filters Section --- 1 per row on mobile, 2 on md, 4 on lg+*/}
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 4 }}
          spacing={4}
          w="full">

          <FormControl isInvalid={!isEmpty(errors.fspId)}>
            <FormLabel>DFSP Name</FormLabel>
            <Controller
              name="fspId"
              control={control}
              render={({ field }) => (
                <Select {...field} placeholder="Select DFSP" width="100%">
                  {participantList?.map((item, index) => (
                    <option key={index} value={item.participantName}>
                      {item.description}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FormErrorMessage>{errors.fspId?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.startDate)} pb="1">
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              name="startDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("endDate");
                  }}
                  onBlur={onBlur}
                  type="datetime-local"
                  width="100%"
                />
              )}
            />
            <FormErrorMessage>{errors.startDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.endDate)} pb="1">
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              name="endDate"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  value={value}
                  onChange={(e) => {
                    onChange(e);
                    trigger("startDate");
                  }}
                  onBlur={onBlur}
                  type="datetime-local"
                  width="100%"
                />
              )}
            />
            <FormErrorMessage>{errors.endDate?.message}</FormErrorMessage>
          </FormControl>

          <FormControl
            display="flex"
            justifyContent={{ base: "stretch", md: "flex-end" }}
            alignItems="flex-end"
            mb={1}>
            <Button
              onClick={handleSubmit(onSearchClick)}
              isDisabled={!isValid}
              colorScheme="blue"
              gap="2"
              size="md"
              w={{ base: "100%", md: "auto" }}>
              <FaSearch /> Search
            </Button>
          </FormControl>
        </SimpleGrid>
      </Stack>

      {settlementIdOptions.length > 0 && (
        <Stack borderWidth="1px" borderRadius="lg" p={4} w="full" spacing={4}>

          <HStack
            spacing={4}
            align="flex-start"
            wrap="wrap" // allows stacking on small screens
          >
            <FormControl isInvalid={!isEmpty(errors.settlementId)}
              w={{ base: "100%", sm: "auto", md: "250px" }}>
              <FormLabel>Settlement ID:</FormLabel>
              <Controller
                name="settlementId"
                control={control}
                render={({ field }) => (
                  <Select {...field} placeholder="Select Settlement ID">
                    {settlementIdOptions.map((opt, index) => (
                      <option key={index} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </HStack>

          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={{ base: 3, md: 4 }}
            justify={{ base: "flex-start", md: "flex-end" }}
            align={{ base: "stretch", md: "center" }}
            w="full">
            <FormControl w={{ base: "100%", md: "250px" }}>
              <Controller
                control={control}
                name="fileType"
                render={({ field }) => (
                  <Select {...field} placeholder="Choose Format">
                    <option value="xlsx">XLSX</option>
                    <option value="pdf">PDF</option>
                  </Select>
                )}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              isDisabled={!isValid || !runButtonState}
              onClick={onDownloadChangeHandler}
              w={{ base: "100%", md: "auto" }}>
              Download
            </Button>
          </Stack>
        </Stack>
      )}
    </VStack>
  );
};

export default memo(SettlementSummaryReport);
