import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Stack,
  useToast,
  Select
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
import { useForm } from 'react-hook-form';
import { type IGetAllOtherParticipant } from '@typescript/services';
import { type IFeeReport } from '@typescript/form/fee-report';
import { useLoadingContext } from '@contexts/hooks';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { TransferType } from '@typescript/pages';

const feeReportHelper = new FeeReportHelper();
const initialFileName = 'Fee-Settlement-Transactions';

const SettlementBankReport = () => {

  const [runButtonState, setRunButtonState] = useState(true);
  const [transferType, setTransferType] = useState<TransferType>('outbound');
  const [selectedSettlementId, setSelectedSettlementId] = useState<any>();
  const [settlementModel, setSettlementModel] = useState<string>('');
  const [settlementIdOptions, setSettlementIdOptions] = useState<any[]>([]);
  const [toFspOptions, setToFspOptions] = useState<any[]>([]);
  const [selectedToFspOption, setSelectedToFspOption] = useState<{ value: string; label: string; }>();

  // Redux
  const user = useGetUserState();
  const toast = useToast();
  const { start, complete } = useLoadingContext();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

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
      participantId: user.data?.participantId
    }).then((data) => {
      prepareToFspsOptions(data);
    });
  }, []);

  const prepareToFspsOptions = (data: IGetAllOtherParticipant) => {
    const options: any[] = [];

    options.push({ value: 'all', label: 'All' }); /** Default option */

    data.participantInfoList.map((toFsp) => {
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
      fromFspId: transferType === 'outbound' ? user.data?.participantName : selectedToFspOption?.value,
      toFspId: transferType === 'outbound' ? selectedToFspOption?.value : user.data?.participantName,
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
    <Box height="fit" p="4">
      <Heading color="trueGray.600" fontSize="1.5em" textAlign="left" p="3">
        Settlement Bank Report
      </Heading>
      <Stack borderWidth="1px" borderRadius="lg" height="full" p="2">
        <HStack alignItems={'flex-start'} p={2} spacing={4}>

          <FormControl width={{ base: '200px', md: '250px' }}
            isInvalid={!isEmpty(errors.settlement_id)}
            pt="3">
            <FormLabel>Settlement Id</FormLabel>
            <Select
              options={settlementIdOptions}
              value={selectedSettlementId}
              onChange={(option: any) => {
                setSelectedSettlementId(option);
              }}
            />
          </FormControl>
        </HStack>
        <HStack justifyContent='flex-end' p={2}>
          <Select
            placeholder="Choose Format"
            value={settlementModel}
            onChange={(e) => setSettlementModel(e.target.value)}
            width="250px"
          >
            <option value="xlsx">XLSX</option>
            <option value="pdf">PDF</option>
          </Select>
          <Button colorScheme='blue' isDisabled={!isValid || !runButtonState} onClick={onDownloadChangeHandler}>
            Download
          </Button>
        </HStack>
      </Stack>
    </Box>
  );
};

export default memo(SettlementBankReport);
