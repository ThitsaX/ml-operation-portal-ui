import { useState, useEffect, memo, useCallback } from 'react';
import {
  Flex,
  FormLabel,
  Input,
  Button,
  Modal,
  ModalProps,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody
} from '@chakra-ui/react';
import { getTransferDetails } from '@services/transfer';
import { IGetTransferDetails } from '@typescript/services';
import moment from 'moment';
import { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';

interface IModalProps extends Omit<ModalProps, 'children'> {
  transferId: string;
}

const TransferDetails = ({ isOpen, onClose, transferId }: IModalProps) => {

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(s => s.app.selectedTimezone);

  // Selected timezone string
  const selectedTZString = selectedTimezone.value;

  //Selected timezone offset
  const timezone = moment.tz(selectedTZString).format('ZZ')

  // State
  const [data, setData] = useState<IGetTransferDetails>({
    transfer_details: {
      transfer_id: '',
      state: '',
      type: '',
      currency: '',
      amount: 0,
      payer: '',
      payer_details: '',
      payer_dfsp: '',
      payee: '',
      payee_details: '',
      payee_dfsp: '',
      settlement_batch: '',
      submitted_on_date: '',
    }
  });

  const getTfData = useCallback(async () => {
    try {
      const tfData: IGetTransferDetails = await getTransferDetails(transferId, timezone)
      setData(tfData);
    } catch (error: unknown) {
      console.log(error);
    }
  }, [transferId, timezone]);

  // Use effect hook
  useEffect(() => {
    getTfData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferId, timezone]);

  return (
    <Modal size="6xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Basic Information</ModalHeader>

        <ModalBody>
          <Flex justify="center" flexDirection="row" flex={1} mb="8">
            <Flex flexDirection="column" flex={1} p="5">
              <FormLabel fontSize="sm" mb="0">
                Transfer ID
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.transfer_id}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Amount
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.amount}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payer
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payer}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payee
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payee}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Settlement Batch ID
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.settlement_batch}
                readOnly
              />
            </Flex>

            <Flex flexDirection="column" flex={1} p="5">
              <FormLabel fontSize="sm" mb="0">
                Transfer State
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.state}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Currency
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.currency}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payer Details
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payer_details}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payee Details
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payee_details}
                readOnly
              />
            </Flex>

            <Flex flexDirection="column" flex={1} p="5">
              <FormLabel fontSize="sm" mb="0">
                Transfer Type
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.type}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Date Submitted
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.submitted_on_date}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payer DFSP
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payer_dfsp}
                readOnly
              />

              <FormLabel fontSize="sm" mb="0">
                Payee DFSP
              </FormLabel>
              <Input
                type="input"
                mb="5"
                size="sm"
                variant="flushed"
                value={data?.transfer_details.payee_dfsp}
                readOnly
              />
            </Flex>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button bg="primary" color="white" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default memo(TransferDetails);
