import { useState, useEffect, memo, useCallback } from 'react';
import {
  Flex,
  Modal,
  ModalProps,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Box,
  Text,
  VStack,
  HStack,
  ModalCloseButton,
  Button,
  useToast,
} from '@chakra-ui/react';
import { getTransferDetails } from '@services/transfer';
import moment from 'moment';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { getErrorMessage } from '@helpers/errors';
import { IGetTransferDetails, IApiErrorResponse } from '@typescript/services';
import { Spinner } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface IModalProps extends Omit<ModalProps, 'children'> {
  transferId: string;
}

const defaultTransferDetails: IGetTransferDetails = {
  transferDetails: {
    transferId: '',
    quoteId: '',
    transferState: '',
    transferType: '',
    subScenario: '',
    currency: '',
    amountType: '',
    quoteAmount: 0,
    transferAmount: 0,
    payeeReceivedAmount: 0,
    payeeDfspFeeAmount: 0,
    payeeDfspCommissionAmount: 0,
    submittedOnDate: '',
    windowId: '',
    settlementId: '',
  },
  payerInformation: {
    idType: '',
    idValue: '',
    dfspId: '',
    name: '',
  },
  payeeInformation: {
    idType: '',
    idValue: '',
    dfspId: '',
    name: '',
  },
  errorInformation: {
    errorCode: '',
    errorDescription: '',
  },
};

const TransferDetails = ({ isOpen, onClose, transferId }: IModalProps) => {
  const { t } = useTranslation();

  const [data, setData] = useState<IGetTransferDetails>(defaultTransferDetails);
  const [loading, setLoading] = useState(false);

  //  Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const toast = useToast();

  // Selected timezone string
  const selectedTZString = selectedTimezone.value;

  //Selected timezone offset
  const timezone = moment.tz(selectedTZString).format('ZZ')

  const getTfData = useCallback(async () => {
    setLoading(true);
    try {
      const tfData: IGetTransferDetails = await getTransferDetails(transferId, timezone)
      setData(tfData);
    } catch (error) {
      toast({
        position: 'top',
        title: getErrorMessage(error as IApiErrorResponse),
        status: 'error',
        isClosable: true,
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [transferId, timezone]);


  useEffect(() => {
    getTfData();
  }, [transferId, timezone]);

  return (
    <Modal size="auto" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        w={{ base: "90%", md: "950px" }}
        maxW="90%"
        mx="auto"
        bg="gray.50"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="2xl"
      >
        <ModalHeader bg="gray.100" borderTop="1px solid" borderColor="gray.200">
          {t('ui.transfer_details')} - {transferId}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH="70vh" overflowY="auto" bg="gray.50">
          {loading ? (
            <Box
              h="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="100%"
            >
              <VStack spacing={4} align="center">
                <Spinner size="xl" color="blue.500" />
                <Text color="gray.600">{t('ui.loading_transfer_details')}</Text>
              </VStack>
            </Box>
          ) : (
            <Flex direction="row" gap={6} wrap="wrap">

              <Box
                flex="1"
                bg="white"
                p={6}
                border="2px solid"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="sm"
              >
                <Text fontWeight="bold" fontSize="lg" mb={4}>
                  {t('ui.general_information')}:
                </Text>
                <VStack spacing={2} align="start">
                  {[
                    [t('ui.transfer_id'), data?.transferDetails.transferId],
                    [t('ui.quote_id'), data?.transferDetails.quoteId],
                    [t('ui.transfer_state'), data?.transferDetails.transferState],
                    [t('ui.transfer_type'), data?.transferDetails.transferType],
                    [t('ui.use_case'), data?.transferDetails.subScenario],
                    [t('ui.currency'), data?.transferDetails.currency],
                    [t('ui.amount_type'), data?.transferDetails.amountType],
                    [t('ui.quote_amount'), data?.transferDetails.quoteAmount],
                    [t('ui.transfer_amount'), data?.transferDetails.transferAmount],
                    [t('ui.payee_receive_amount'), data?.transferDetails.payeeReceivedAmount],
                    [t('ui.payee_dfsp_fee'), data?.transferDetails.payeeDfspFeeAmount],
                    [t('ui.payee_dfsp_commission'), data?.transferDetails.payeeDfspCommissionAmount],
                    [t('ui.submitted_date'), data?.transferDetails.submittedOnDate],
                    [t('ui.window_id'), data?.transferDetails.windowId],
                    [t('ui.settlement_id'), data?.transferDetails.settlementId],
                  ].map(([label, value]) => (
                    <HStack key={label} align="start">
                      <Text minW="200px" fontWeight="bold">{label}:</Text>
                      <Text>{value ?? '-'}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <VStack flex="1" spacing={4} align="stretch">

                <Box
                  bg="white"
                  p={6}
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text fontWeight="bold" fontSize="lg" mb={4}>
                    {t('ui.payer_information')}:
                  </Text>
                  <VStack spacing={2} align="start">
                    <Text><b>{t('ui.id_type')}:</b> {data?.payerInformation.idType}</Text>
                    <Text><b>{t('ui.id_value')}:</b> {data?.payerInformation.idValue}</Text>
                    <Text><b>{t('ui.dfsp_id')}:</b> {data?.payerInformation.dfspId}</Text>
                    <Text><b>{t('ui.name')}:</b> {data?.payerInformation.name}</Text>
                  </VStack>
                </Box>

                <Box
                  bg="white"
                  p={6}
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text fontWeight="bold" fontSize="lg" mb={4}>
                    {t('ui.payee_information')}:
                  </Text>
                  <VStack spacing={2} align="start">
                    <Text><b>{t('ui.id_type')}:</b> {data?.payeeInformation.idType}</Text>
                    <Text><b>{t('ui.id_value')}:</b> {data?.payeeInformation.idValue}</Text>
                    <Text><b>{t('ui.dfsp_id')}:</b> {data?.payeeInformation.dfspId}</Text>
                    <Text><b>{t('ui.name')}:</b> {data?.payeeInformation.name}</Text>
                  </VStack>
                </Box>

                <Box
                  bg="white"
                  p={6}
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Text fontWeight="bold" fontSize="lg" mb={4}>
                    {t('ui.error_information')}:
                  </Text>
                  <VStack spacing={2} align="start">
                    <Text><b>{t('ui.error_code')}:</b> {data?.errorInformation?.errorCode || '-'}</Text>
                    <Text><b>{t('ui.error_description')}:</b> {data?.errorInformation?.errorDescription || '-'}</Text>
                  </VStack>
                </Box>
              </VStack>
            </Flex>)}
        </ModalBody>
        <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200">
          <Button colorScheme="blue" onClick={onClose}>
            {t('ui.close')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default memo(TransferDetails);
