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
  InputGroup,
  InputRightElement,
  IconButton,
  Box,
  Text,
  Spinner,
  Tooltip
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
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [roleList, setRoleList] = useState<IParticipantUserRole[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);

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
    setIsRoleLoading(true);
    try {
      const roles = await getRoleListByParticipant(participantName);
      setRoleList(roles || []);
      return roles || [];
    } catch (error) {
      setRoleList([]);
      return [];
    }finally {
    setIsRoleLoading(false);
  }
  };

  // Initialize form on open
  useEffect(() => {
    if (!isOpen) return;
    setFormReady(false);
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
      setFormReady(true);
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
        borderRadius="lg"
        overflow="hidden"
        boxShadow="2xl"
      >
      <ModalHeader textAlign="center">{isEdit ? t('ui.edit_user') : t('ui.add_new_user')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={10}>
          {!formReady ? (
            <Box
              minH={280}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="100%"
            >
              <VStack spacing={4} align="center">
                <Spinner size="xl" color="blue.500" />
                <Text color="gray.600">{t('ui.loading_user_details')}</Text>
              </VStack>
            </Box>
          ):(
          <VStack spacing={4} align="stretch">
            <HStack spacing={5} align="start">
              <SimpleGrid columns={2} spacing={6} width="100%">
                <FormControl isInvalid={!isEmpty(errors.firstName)} isRequired>
                  <Input placeholder={t('ui.first_name')} {...register('firstName')} />
                  <FormErrorMessage>{errors.firstName?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!isEmpty(errors.lastName)} isRequired>
                  <Input placeholder={t('ui.last_name')} {...register('lastName')} />
                  <FormErrorMessage>{errors.lastName?.message}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </HStack>

            <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
              <Input placeholder={t('ui.email_required')} {...register('email')} disabled={isEdit} />
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
                    placeholder={t('ui.select_organization')}
                      options={participantInfoList?.map(org => ({
                        value: org.participantId,
                        label: org.participantDescription
                          ? `${org.participantName} (${org.participantDescription})`
                          : org.participantName
                      })) ?? []}
                      value={
                          participantInfoList?.find(org => org.participantId === field.value)
                            ? {
                                value: field.value,
                                label: (() => {
                                  const org = participantInfoList.find(org => org.participantId === field.value);
                                  return org
                                    ? org.participantDescription
                                      ? `${org.participantName} (${org.participantDescription})`
                                      : org.participantName
                                    : field.value;
                                })(),
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
                <Tooltip label={t('ui.sync_participant')} placement="top">
                <Button
                  leftIcon={<IoReload />}
                  colorScheme="teal"
                  variant="outline"
                  onClick={() => syncHubParticipantsToPortal()}
                  minW="40px"
                  px={2}
                  aria-label={t('ui.sync_organizations')}
                />
                </Tooltip>
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
                    isLoading={isRoleLoading}
                    isDisabled={isRoleLoading}
                    options={roleList?.map(role => ({ value: role.roleId, label: role.name })) ?? []}
                    value={
                      (roleList ?? [])
                        .filter(role => field.value.includes(role.roleId))
                        .map(role => ({ value: role.roleId, label: role.name }))
                    }
                    onChange={(selected: OptionType[]) => field.onChange(selected.map(s => s.value))}
                    placeholder={t('ui.select_role')}
                  />
                )}
              />
              <FormErrorMessage>
                {errors.roleIdList?.message === 'Select at least one role'
                  ? t('ui.select_at_least_one_role')
                  : errors.roleIdList?.message}
              </FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.jobTitle)}>
              <Input placeholder={t('ui.job_title')} {...register('jobTitle')} />
              <FormErrorMessage>{errors.jobTitle?.message}</FormErrorMessage>
            </FormControl>

            {!isEdit && (
              <>
                <FormControl isInvalid={!isEmpty(errors.password)}>
                  <InputGroup>
                    <Input type={showPassword ? "text" : "password"} placeholder={t('ui.password_required')} {...register('password')} />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        aria-label={t('ui.show_password_aria')}
                        icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        bg="transparent"
                        rounded="full"
                        size="sm"
                        _hover={{
                          bg: 'transparent'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!isEmpty(errors.confirmPassword)}>
                  <InputGroup>
                    <Input type={showConfirmPassword  ? "text" : "password"} placeholder={t('ui.confirm_password')} {...register('confirmPassword')} />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        aria-label={t('ui.show_password_aria')}
                        icon={showConfirmPassword  ? <IoEyeOffOutline /> : <IoEyeOutline />}
                        bg="transparent"
                        rounded="full"
                        size="sm"
                        _hover={{
                          bg: 'transparent'
                        }}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                </FormControl>
              </>
            )}
          </VStack>)}
        </ModalBody>

        <ModalFooter display="flex" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            {t('ui.cancel')}
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit(handleFormSubmit)}
           isLoading={isSaving}
           loadingText={isEdit ? `${t('ui.update')}...` : t('ui.saving')}
           isDisabled={!isValid || isSaving || isRoleLoading}>
            {isEdit ? t('ui.update') : t('ui.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditUserModal;
