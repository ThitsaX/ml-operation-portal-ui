import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  useToast,
  Select as ChakaraSelect
} from '@chakra-ui/react';
import { FeeReportHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  downloadFile,
  generateFeeReport,
  getAllOtherParticipants
} from '@services/report';

import { useGetUserState } from '@store/hooks';

import { isEmpty } from 'lodash-es';
import moment from 'moment-timezone';
import { memo, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaCaretDown } from 'react-icons/fa';
import Select from 'react-select';
import { type IGetAllOtherParticipant } from '@typescript/services';
import { type IFeeReport } from '@typescript/form/fee-report';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { TransferType } from '@typescript/pages';

const feeReportHelper = new FeeReportHelper();

const FeeStatement = () => {
  const [runButtonState, setRunButtonState] = useState(true);
  const [transferType, setTransferType] = useState<TransferType>('outbound');

  const { start, complete } = useLoadingContext();
  const toast = useToast();

  const user = useGetUserState();
  const [toFspOptions, setToFspOptions] = useState<any[]>([]);
  const [selectedToFspOption, setSelectedToFspOption] = useState<{
    value: string;
    label: string;
  }>();
  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const initialFileName = 'Fee-Settlement-Transactions';

  const schema = feeReportHelper.schema;

  const {
    control,
    getValues,
    trigger,
    formState: { errors, isValid }
  } = useForm<IFeeReport>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: moment().format('yyyy-MM-DD'),
      end_date: moment().format('yyyy-MM-DD')
    },
    mode: 'onChange'
  });

  useEffect(() => {
    getAllOtherParticipants(user, {
      participantId: user.data?.participant_id
    }).then((data) => {
      prepareToFspsOptions(data);
    });
  }, []);

  const prepareToFspsOptions = (data: IGetAllOtherParticipant) => {
    const options: any[] = [];

    options.push({ value: 'all', label: 'All' }); /** Default option */

    data.participant_info_list.map((toFsp) => {
      options.push({ value: toFsp.dfsp_code, label: toFsp.dfsp_code });
    });

    setToFspOptions(options);
    setSelectedToFspOption(options[0]);
  };

  const onDownloadChangeHandler = (e: any) => {
    start();
    setRunButtonState(false);

    const fileType = e.target.value;

    const startDate = getValues().start_date;
    const endDate = getValues().end_date;

    const utcStartDate = moment.utc(startDate).startOf('day').format();

    const utcEndDate = moment.utc(endDate).endOf('day').format();

    const selectedTZString = selectedTimezone.value;

    generateFeeReport(user, {
      startDate: utcStartDate,
      endDate: utcEndDate,
      fromFspId: transferType === 'outbound' ? user.data?.dfsp_code : selectedToFspOption?.value,
      toFspId: transferType === 'outbound' ? selectedToFspOption?.value : user.data?.dfsp_code,
      tzOffSet: selectedTimezone.offset === 0
        ? "0000"
        : moment().tz(selectedTZString).format('ZZ').replace('+', ''),
      fileType
    })
      .then((res: any) => {
        if (res?.rpt_byte?.length > 0) {
          downloadFile(initialFileName, fileType, res.rpt_byte);
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
    <Box height='100vh'>
      <Box height="fit" w="800px" p="4" >
        <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" p="3">
          DFSP Transactions for Fee Settlement
        </Heading>
        <Stack borderWidth="1px" borderRadius="lg" height="full" p="2">
          <HStack alignItems={'flex-start'} p={2} spacing={4}>
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
          </HStack>

          <HStack alignItems={'flex-start'} p={2} spacing={4}>
            <FormControl>
              <FormLabel>Direction</FormLabel>
              <ChakaraSelect
                value={transferType}
                onChange={(e) =>
                  setTransferType(e.target.value as TransferType)
                }>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </ChakaraSelect>
            </FormControl>
            <FormControl>
              <FormLabel>From FspId</FormLabel>
              {transferType === 'outbound' ? <Input value={user.data?.dfsp_code} readOnly={true} /> :
                <Select
                  options={toFspOptions}
                  value={selectedToFspOption}
                  onChange={(option: any) => {
                    setSelectedToFspOption(option);
                  }}
                />}
            </FormControl>
            <FormControl>
              <FormLabel>To FspId</FormLabel>
              {transferType === 'outbound' ? <Select
                options={toFspOptions}
                value={selectedToFspOption}
                onChange={(option: any) => {
                  setSelectedToFspOption(option);
                }}
              /> :
                <Input value={user.data?.dfsp_code} readOnly={true} />}
            </FormControl>
          </HStack>

          <HStack justifyContent='flex-end' p={2}>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FaCaretDown />}
                isDisabled={!isValid || !runButtonState}>
                Run
              </MenuButton>
              <MenuList onClick={onDownloadChangeHandler} placeholder="Choose">
                <MenuItem value="csv">Download CSV</MenuItem>
                <MenuItem value="xlsx">Download Excel</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

export default memo(FeeStatement);
