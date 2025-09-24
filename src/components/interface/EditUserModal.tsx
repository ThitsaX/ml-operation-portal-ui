import React, { useEffect } from 'react';
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
  FormControl,
  FormErrorMessage,
  SimpleGrid,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MultiSelect, { OptionType } from './MultiSelect';
import { IParticipantOrganization, IParticipantUser, IParticipantUserRole } from '@typescript/services';
import { UserManagementHelper } from '@helpers/form';
import { isEmpty } from 'lodash-es';
import { IoReload } from 'react-icons/io5';
import { syncHubParticipantsToPortal } from '@services/dashboard';
import { UserStatus } from '@typescript/form';

const userSchema = new UserManagementHelper();

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedUser?: Partial<IParticipantUser>;
  roleList?: IParticipantUserRole[];
  participantInfoList?: IParticipantOrganization[];
  onSave: (data: IParticipantUser) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  selectedUser,
  roleList,
  participantInfoList,
  onSave,
}) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<IParticipantUser>({
    resolver: zodResolver(isEdit ? userSchema.editSchema : userSchema.schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      participantId: '',
      roleIdList: [],
      jobTitle: '',
      status: UserStatus.ACTIVE,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: selectedUser?.firstName ?? '',
        lastName: selectedUser?.lastName ?? '',
        email: selectedUser?.email ?? '',
        participantId: selectedUser?.participantId ?? '',
        roleIdList: selectedUser?.roleIdList ?? [],
        jobTitle: selectedUser?.jobTitle ?? '',
        status: selectedUser?.status,
      });
    }
  }, [isOpen, selectedUser, reset]);

  const handleFormSubmit = (values: IParticipantUser) => {
    onSave(values);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">{isEdit ? 'Edit User' : 'Add New User'}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={10}>
          <VStack spacing={4} align="stretch">
            <HStack spacing={5} align="start">
              <SimpleGrid columns={2} spacing={6} width="100%">
                <FormControl isInvalid={!isEmpty(errors.firstName)} isRequired>
                  <Input placeholder="First Name*" {...register('firstName')} />
                  <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!isEmpty(errors.lastName)} isRequired>
                  <Input placeholder="Last Name*" {...register('lastName')} />
                  <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </HStack>

            <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
              <Input placeholder="Email*" {...register('email')} disabled={isEdit} />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.roleIdList)} isRequired>
              <Controller
                control={control}
                name="roleIdList"
                render={({ field }) => (
                  <MultiSelect
                    options={roleList?.map(role => ({ value: role.roleId, label: role.name })) ?? []}
                    value={
                      (roleList ?? [])
                        .filter(role => field.value.includes(role.roleId))
                        .map(role => ({ value: role.roleId, label: role.name }))
                    }
                    onChange={(selected: OptionType[]) => field.onChange(selected.map(s => s.value))}
                    placeholder="Select Role*"
                  />
                )}
              />
              <FormErrorMessage>{errors.roleIdList?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.participantId)} isRequired>
              <HStack>
                <ChakraSelect placeholder="Select Organization*" {...register('participantId')}
                  size="md"
                  width="100%">
                  {participantInfoList?.map(org => (
                    <option key={org.participantId} value={org.participantId}>
                      {org.participantName}
                    </option>
                  ))}
                </ChakraSelect>
                <Button
                  leftIcon={<IoReload />}
                  colorScheme="teal"
                  variant="outline"
                  onClick={() => syncHubParticipantsToPortal()}
                  minW="40px"
                  px={2}
                  aria-label="Sync Organizations"
                />
              </HStack>
              <FormErrorMessage>{errors.participantId?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.jobTitle)}>
              <Input placeholder="Job Title" {...register('jobTitle')} />
              <FormErrorMessage>{errors.jobTitle?.message}</FormErrorMessage>
            </FormControl>

            {!isEdit && (
              <>
                <FormControl isInvalid={!isEmpty(errors.password)}>
                  <Input placeholder="Password*" {...register('password')} />
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!isEmpty(errors.confirmPassword)}>
                  <Input placeholder="Confirm Password" {...register('confirmPassword')} />
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>
              </>
            )}

          </VStack>
        </ModalBody>

        <ModalFooter display="flex" gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit(handleFormSubmit)}
            isLoading={isSubmitting}
            isDisabled={!isValid}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
