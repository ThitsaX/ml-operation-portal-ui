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
import { getRequestErrorMessage } from '@helpers/errors';
import { IGetTransferDetails, IApiErrorResponse } from '@typescript/services';

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

  const [data, setData] = useState<IGetTransferDetails>(defaultTransferDetails);

  //  Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);
  const toast = useToast();

  // Selected timezone string
  const selectedTZString = selectedTimezone.value;

  //Selected timezone offset
  const timezone = moment.tz(selectedTZString).format('ZZ')

  const getTfData = useCallback(async () => {
    try {
      const tfData: IGetTransferDetails = await getTransferDetails(transferId, timezone)
      setData(tfData);
    } catch (error: unknown) {
      toast({
        position: 'top',
        title: getRequestErrorMessage(error as IApiErrorResponse),
        status: 'error',
        isClosable: true,
        duration: 3000
      });
    }
  }, [transferId, timezone]);


  useEffect(() => {
    getTfData();
  }, [transferId, timezone]);

  return (
    <Modal size="6xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader bg="gray.100" borderTop="1px solid" borderColor="gray.200">
          Transfer Details - {transferId}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH="70vh" overflowY="auto" bg="gray.50">
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
                General Information:
              </Text>
              <VStack spacing={2} align="start">
                {[
                  ['Transfer ID', data?.transferDetails.transferId],
                  ['Quote ID', data?.transferDetails.quoteId],
                  ['Transfer State', data?.transferDetails.transferState],
                  ['Transfer Type', data?.transferDetails.transferType],
                  ['Use Case', data?.transferDetails.subScenario],
                  ['Currency', data?.transferDetails.currency],
                  ['Amount Type', data?.transferDetails.amountType],
                  ['Quote Amount', data?.transferDetails.quoteAmount],
                  ['Transfer Amount', data?.transferDetails.transferAmount],
                  ['Payee Receive Amount', data?.transferDetails.payeeReceivedAmount],
                  ['Payee DFSP Fee', data?.transferDetails.payeeDfspFeeAmount],
                  ['Payee DFSP Commission', data?.transferDetails.payeeDfspCommissionAmount],
                  ['Submitted Date', data?.transferDetails.submittedOnDate],
                  ['Window ID', data?.transferDetails.windowId],
                  ['Settlement ID', data?.transferDetails.settlementId],
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
                  Payer Information:
                </Text>
                <VStack spacing={2} align="start">
                  <Text><b>ID Type:</b> {data?.payerInformation.idType}</Text>
                  <Text><b>ID Value:</b> {data?.payerInformation.idValue}</Text>
                  <Text><b>DFSP ID:</b> {data?.payerInformation.dfspId}</Text>
                  <Text><b>Name:</b> {data?.payerInformation.name}</Text>
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
                  Payee Information:
                </Text>
                <VStack spacing={2} align="start">
                  <Text><b>ID Type:</b> {data?.payeeInformation.idType}</Text>
                  <Text><b>ID Value:</b> {data?.payeeInformation.idValue}</Text>
                  <Text><b>DFSP ID:</b> {data?.payeeInformation.dfspId}</Text>
                  <Text><b>Name:</b> {data?.payeeInformation.name}</Text>
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
                  Error Information:
                </Text>
                <VStack spacing={2} align="start">
                  <Text><b>Error Code:</b> {data?.errorInformation?.errorCode || '-'}</Text>
                  <Text><b>Error Description:</b> {data?.errorInformation?.errorDescription || '-'}</Text>
                </VStack>
              </Box>
            </VStack>
          </Flex>
        </ModalBody>
        <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200">
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default memo(TransferDetails);
