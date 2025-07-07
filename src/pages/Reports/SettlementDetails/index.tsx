import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  useToast,
  VStack
} from '@chakra-ui/react';
import { SettlementReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateSettlementDetailReport,
  getSettlementIds
} from '@services/report';

import { useGetUserState } from '@store/hooks';
import { type ISettlementDetailReport } from '@typescript/form/settlement-detail-report';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FaCaretDown, FaSearch } from "react-icons/fa";
import { IGetSettlementIds } from "@typescript/services/report";
import { useLoadingContext } from "@contexts/hooks";
import Select from 'react-select'
import { ITimezoneOption } from "react-timezone-select";
import { useSelector } from 'react-redux';
import { RootState } from '@store';


const settlementReportHelper = new SettlementReportHelper();

const SettleDetails = () => {
  const { start, complete } = useLoadingContext();
  const toast = useToast();
  const [runButtonState, setRunButtonState] = useState(true);

  const initialFileName = 'Settlement-Details-Report';
  const user = useGetUserState();

  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  const {
    control,
    trigger,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm<ISettlementDetailReport>({
    resolver: zodResolver(settlementReportHelper.schema),
    defaultValues: {
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
    },
    mode: 'onChange'
  });

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const fileType = e.target.value;


    const selectedTZString = selectedTimezone.value;
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTZString).format('ZZ').replace('+', '');

    generateSettlementDetailReport({
      settlement_id: selectedSettlementId?.value,
      fspid: user.data?.dfsp_code,
      file_type: fileType,
      timezoneOffset: tzOffSet
    })
      .then((res: any) => {
        if (res?.detail_report_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res?.detail_report_byte);
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

    const startDate = getValues().start_date;
    const endDate = getValues().end_date;

    let utcStartDate = moment.utc(startDate).startOf('day').format();

    const utcEndDate = moment.utc(endDate).endOf('day').format();

    //Getting offset
    let tzOffSet: string = selectedTimezone.offset === 0
      ? "0000"
      : moment().tz(selectedTimezone.value).format('ZZ').replace('+', '');

    getSettlementIds(user, utcStartDate, utcEndDate, tzOffSet)
      .then((data: IGetSettlementIds) => {
        if (data.settlement_id_list?.length === 0) {
          toast({
            position: 'top',
            description: 'No data found',
            status: 'warning',
            isClosable: true,
            duration: 3000
          });
        }

        let options: any[] = [];

        data.settlement_id_list.map((item) => {
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

  const onSearchClick = useCallback(
    (values: ISettlementDetailReport) => {
      search();
    },
    [search]
  );

  return (
    <Box height="full" w="400px" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" pb="3">
        DFSP Settlement Details Report
      </Heading>
      <Stack borderWidth="1px" borderRadius="lg" height="full">
        <VStack p="4">
          <FormControl pb="1">
            <FormLabel>FspId</FormLabel>
            <Input value={user.data?.dfsp_code} readOnly={true} />
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.start_date)}
            isRequired
            pb="1">
            <FormLabel>Start Date</FormLabel>
            <Controller
              control={control}
              render={({ field: { value, onChange, onBlur } }) => {
                return (
                  <Input
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('end_date');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="start_date"
            />
            <FormErrorMessage>{errors.start_date?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.end_date)} isRequired pb="1">
            <FormLabel>End Date</FormLabel>
            <Controller
              control={control}
              render={({
                field: { value, onChange, onBlur },
                fieldState: { error }
              }) => {
                return (
                  <Input
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      trigger('start_date');
                    }}
                    onBlur={onBlur}
                    type="date"
                  />
                );
              }}
              name="end_date"
            />
            <FormErrorMessage>{errors.end_date?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.fspid)} pt="3" textAlign="right">
            <Button onClick={handleSubmit(onSearchClick)} isDisabled={!isValid}
              colorScheme='teal' gap="2"
              size='md'>
              <FaSearch /> Search
            </Button>
          </FormControl>

          <FormControl
            isInvalid={!isEmpty(errors.fspid)}
            pt="3"
            visibility={
              settlementIdOptions?.length == 0 ? 'hidden' : 'visible'
            }>
            <FormLabel>Settlement Id</FormLabel>
            <Select
              options={settlementIdOptions}
              value={selectedSettlementId}
              onChange={(option: any) => {
                setSelectedSettlementId(option);
              }}
            />
          </FormControl>

          <Box
            width="100%"
            textAlign="right"
            visibility={
              settlementIdOptions?.length == 0 ? 'hidden' : 'visible'
            }>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FaCaretDown />}
                isDisabled={
                  !isValid || selectedSettlementId == null
                }>
                Run
              </MenuButton>
              <MenuList onClick={onDownloadChangeHandler} placeholder="Choose">
                <MenuItem value="csv">Download CSV</MenuItem>
                <MenuItem value="xlsx">Download Excel</MenuItem>
              </MenuList>
            </Menu>
          </Box>
        </VStack>
      </Stack>
    </Box>
  );
};

export default memo(SettleDetails);
