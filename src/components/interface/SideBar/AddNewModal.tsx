// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createRole } from '@services/participant';
import { IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';

interface AddNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddNewModal = ({ isOpen, onClose, onSuccess }: AddNewModalProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isCreateDisabled = !roleName.trim() || !roleType.trim();

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await createRole({
        name: roleName.trim(),
        roleType: roleType.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ['getRoleList'] });
      toast({
        title: 'Role Created',
        description: `Role "${roleName}" has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const error = err as IApiErrorResponse
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setRoleName('');
    setRoleType('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Add New Role</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Role Name</FormLabel>
              <Input
                placeholder="e.g. dataAnalyst"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                autoFocus
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Role Type</FormLabel>
              <Input
                placeholder="INDIRECT_DFSP"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Flex justify="flex-end" align="center" gap={3} w="full">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isLoading}
              isDisabled={isCreateDisabled}
              loadingText="Creating..."
            >
              Create role
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddNewModal;
