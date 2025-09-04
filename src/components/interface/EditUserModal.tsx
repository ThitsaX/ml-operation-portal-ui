import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Input,
  Select as ChakraSelect,
  Button,
} from '@chakra-ui/react';
import MultiSelect, { OptionType } from './MultiSelect';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedUser: { email?: string };
}

const roleOptions: OptionType[] = [
  { value: 'HUB - admin', label: 'HUB - admin' },
  { value: 'HUB - manager', label: 'HUB - manager' },
  { value: 'DFSP - admin', label: 'DFSP - admin' },
];

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, isEdit, selectedUser }) => {
  const [selectedRoles, setSelectedRoles] = useState<OptionType[]>([]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">{isEdit ? `Edit User` : `Add New`}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <Input placeholder="First Name*" />
              <Input placeholder="Last Name*" />
            </HStack>

            <Input placeholder="Email*" isDisabled value={selectedUser?.email || ''} />

            {/* Role - using separate MultiSelect component */}
            <MultiSelect
              options={roleOptions}
              value={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Select Role*"
            />

            <ChakraSelect placeholder="Select Organization*">
              <option value="HUB">HUB</option>
              <option value="DFSP">DFSP</option>
              <option value="Settlement Bank">Settlement Bank</option>
            </ChakraSelect>

            <Input placeholder="Job Title" />

            <Button variant="link" colorScheme="blue" alignSelf="flex-start">
              Reset Password
            </Button>

            <Input placeholder="Password*" type="password" />
            <Input placeholder="Confirm Password*" type="password" />
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3}>Submit</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
