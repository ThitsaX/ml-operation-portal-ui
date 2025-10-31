import React, { useEffect, useState } from 'react';
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
import { CustomSelect } from '@components/interface';
import { OptionType } from '@components/interface/CustomSelect';
import { IParticipantOrganization, IParticipantUser, IParticipantUserForm, IParticipantUserRole } from '@typescript/services';
import { UserManagementHelper } from '@helpers/form';
import { isEmpty } from 'lodash-es';
import { IoReload } from 'react-icons/io5';
import { syncHubParticipantsToPortal } from '@services/participant';
import { UserStatus } from '@typescript/form';
import { getRoleListByParticipant } from '@services/participant';

const userSchema = new UserManagementHelper();


interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit: boolean;
  selectedUser?: Partial<IParticipantUser>;
  participantInfoList?: IParticipantOrganization[];
  onSave: (data: IParticipantUserForm) => void;
  isSaving?: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  isEdit,
  selectedUser,
  participantInfoList,
  onSave,
  isSaving,
}) => {
  const [roleList, setRoleList] = useState<IParticipantUserRole[]>([]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<IParticipantUserForm>({
    resolver: zodResolver(isEdit ? userSchema.editSchema : userSchema.schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      participantId: '',
      roleIdList: [],
      jobTitle: '',
      status: UserStatus.ACTIVE,
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  // Fetch roles by participantName
  const getRoleList = async (participantName: string) => {
    try {
      const roles = await getRoleListByParticipant(participantName);
      setRoleList(roles || []);
      return roles || [];
    } catch (error) {
      setRoleList([]);
      return [];
    }
  };

  // Initialize form on open
  useEffect(() => {
    if (!isOpen) return;

    const initializeForm = async () => {
      if (isEdit && selectedUser?.participantId && participantInfoList) {
        const org = participantInfoList.find(p => p.participantId === selectedUser.participantId);
        if (org) {
          const roles = await getRoleList(org.participantName);
          const selectedIds =
            selectedUser.roleList?.map(label => roles.find(r => r.name === label)?.roleId).filter(Boolean) ?? [];

          reset({
            firstName: selectedUser.firstName ?? '',
            lastName: selectedUser.lastName ?? '',
            email: selectedUser.email ?? '',
            participantId: selectedUser.participantId ?? '',
            roleIdList: selectedIds,
            jobTitle: selectedUser.jobTitle ?? '',
            status: selectedUser.status ?? UserStatus.ACTIVE,
            password: '',
            confirmPassword: '',
          });
        }
      } else {
        // Not editing → reset empty form
        setRoleList([]);
        reset({
          firstName: '',
          lastName: '',
          email: '',
          participantId: '',
          roleIdList: [],
          jobTitle: '',
          status: UserStatus.ACTIVE,
          password: '',
          confirmPassword: '',
        });
      }
    };

    initializeForm();
  }, [isOpen, isEdit, selectedUser, participantInfoList, reset]);

  // Organization change
  const handleOrgChange = async (participantId: string) => {
    const org = participantInfoList?.find(p => p.participantId === participantId);
    const roles = org ? await getRoleList(org.participantName) : [];
    reset({ ...getValues(), participantId, roleIdList: [] });
  };

  // Submit handler
  const handleFormSubmit = (values: IParticipantUserForm) => {
    onSave(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent
        w={{ base: "90%", md: "500px" }}
        maxW="90%"
        mx="auto"
      >
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

            <FormControl isInvalid={!isEmpty(errors.participantId)} isRequired>
              <HStack>
                <Controller
                  control={control}
                  name="participantId"
                  render={({ field }) => (
                    <CustomSelect
                    menuPortalTarget={true}
                    placeholder="Select Organization*"
                      options={participantInfoList?.map(org => ({
                          value: org.participantId,
                          label: org.participantName })) ?? []}
                      value={
                          participantInfoList?.find(org => org.participantId === field.value)
                            ? {
                                value: field.value,
                                label: participantInfoList.find(org => org.participantId === field.value)?.participantName || field.value
                              }
                            : null
                        }
                      onChange={(selected: OptionType | null) => {
                        field.onChange(selected ? selected.value : '');
                        handleOrgChange(selected ? selected.value : '');
                      }}
                    />
                  )}
                />

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

            <FormControl isInvalid={!isEmpty(errors.roleIdList)} isRequired>
              <Controller
                control={control}
                name="roleIdList"
                render={({ field }) => (
                  <CustomSelect
                    menuPortalTarget={true}
                    isMulti={true}
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit(handleFormSubmit)}
           isLoading={isSaving}
           loadingText={isEdit ? "Updating..." : "Saving..."}
           isDisabled={!isValid || isSaving}>
            {isEdit ? 'Update' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
