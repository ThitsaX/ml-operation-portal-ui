import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Image,
  VStack,
  Heading,
  useToast,
  Stack,
  Flex,
  FormErrorMessage,
  FormHelperText,
  IconButton,
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { IParticipantProfile } from '@typescript/services';
import { modifyParticipant } from '@services/participant';
import { OrganizationHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEmpty } from 'lodash-es'
import { getParticipantProfile } from '@services/participant';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { RxCrossCircled } from "react-icons/rx";
import { hasActionPermission } from '@helpers/permissions';
import { useTranslation } from 'react-i18next';

interface OrganizationProfileProps {
  participantId: string;
}

const defaultFormValues: IParticipantProfile = {
  participantId: '',
  participantName: '',
  description: '',
  address: '',
  mobile: '',
  logo: '',
  logoFileType: '',
  connectionType: '-',
  connectedParticipants: '-',
};

const OrganizationProfile: React.FC<OrganizationProfileProps> = ({ participantId }) => {
  const { t } = useTranslation();

  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasEditPermission = hasActionPermission("ModifyParticipantProfile");
  const organizationHelper = new OrganizationHelper();

  const {
    control,
    handleSubmit,
    trigger,
    register,
    formState: { isValid, isDirty, errors },
    setValue,
    reset,
  } = useForm<IParticipantProfile>({
    defaultValues: defaultFormValues,
    resolver: zodResolver(organizationHelper.schema),
    mode: 'onChange',
  });

  const mapProfileToFormValues = (profile: Partial<IParticipantProfile>): IParticipantProfile => ({
    participantId: profile.participantId ?? '',
    participantName: profile.participantName ?? '',
    description: profile.description ?? '',
    address: profile.address ?? '',
    mobile: profile.mobile ?? '',
    logo: profile.logo ?? '',
    logoFileType: profile.logoFileType ?? '',
    connectionType: profile.connectionType ?? '-',
    connectedParticipants: profile.connectedParticipants ?? '-',
  });

  useEffect(() => {
    if (participantId) {
      getParticipantProfile(participantId)
        .then(profileData => {
          if (!profileData) return;
          const profileForForm = mapProfileToFormValues(profileData);
          reset(profileForForm);
          setFileType(profileForForm.logoFileType);

          setPreview(profileForForm.logo);
          setValue('logo', profileForForm.logo, { shouldDirty: false });
          setValue('logoFileType', profileForForm.logoFileType, { shouldDirty: false });
        })
        .catch(err => {
          toast({
            title: t('ui.error'),
            description: getErrorMessage(err) || t('ui.failed_to_load_profile'),
            status: 'error',
          });
        }).finally(() => setIsLoading(false));
    }
  }, [participantId, reset, setValue, t, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
    const MAX_FILE_SIZE = 1 * 1024 * 1024;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      toast({
        title: t('ui.invalid_file_type'),
        description: t('ui.only_png_and_jpeg_formats_are_allowed_file_name', { fileName: file.name }),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('ui.file_too_large'),
        description: t('ui.please_upload_an_image_smaller_than_1mb_file_name', { fileName: file.name }),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      e.target.value = '';
      return;
    }

    setFileType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      const base64String = result?.split(',')[1] ?? null;

      setPreview(base64String);
      setValue('logo', base64String ?? '', {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue('logoFileType', file.type, {
        shouldValidate: true,
        shouldDirty: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearLogo = () => {
    setPreview(null);
    setFileType(null);
    setValue('logo', '', { shouldDirty: true, shouldValidate: true });
    setValue('logoFileType', '', { shouldDirty: true, shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const organizationHandler = async (values: IParticipantProfile) => {
    setIsSubmitting(true);
    try {
      const { connectionType, connectedParticipants, ...payload } = values;
      await modifyParticipant(payload as IParticipantProfile);
      toast({
        title: t('ui.profile_updated'),
        position: 'top',
        description: t('ui.organization_profile_updated_successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      reset(values);
    } catch (error: any) {
      const err = error as IApiErrorResponse;
      toast({
        title: t('ui.update_failed'),
        position: 'top',
        description: getErrorMessage(err) || t('ui.failed_to_update_organization_profile'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Box
      width="100%"
      p={4}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="md"
    >
      <Box mb={6}>
        <Heading fontSize="lg" fontWeight="bold">
          {t('ui.organization_profile')}
        </Heading>
      </Box>

      <VStack spacing={4} align="stretch" opacity={isLoading || !hasEditPermission ? 0.8 : 1} pointerEvents={isLoading ? 'none' : 'auto'}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!isEmpty(errors.description)} flex={1} isDisabled={!hasEditPermission}>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.description')}</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.description?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.address)} flex={1} isDisabled={!hasEditPermission}>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.address')}</FormLabel>
            <Controller
              name='address'
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.address?.message}</FormErrorMessage>
          </FormControl>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!isEmpty(errors.mobile)} flex={1} isDisabled={!hasEditPermission}>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.contact_number')}</FormLabel>
            <Controller
              name='mobile'
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.mobile?.message}</FormErrorMessage>
          </FormControl>

          <FormControl flex={1} isDisabled={!hasEditPermission}>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.logo')}</FormLabel>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'flex-start', md: 'center' }}>
              <Box flex={{ base: '1 0 100%', sm: 1 }} w={{ base: '100%', sm: 'auto' }}>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".png, .jpeg"
                  fontSize="md"
                  pt={1}
                  w="100%"
                  isDisabled={!hasEditPermission}
                  onChange={handleFileChange}
                />
                <FormHelperText id="logo-helper-text" fontSize="xs">
                  {t('ui.accepted_formats_png_jpeg_max_size_1mb')}
                </FormHelperText>
                <input type="hidden" {...register('logo')} />
                <input type="hidden" {...register('logoFileType')} />
              </Box>

              {preview && (
                <Box
                  position="relative"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={1}
                  bg="gray.50"
                  height={{ base: '80px', md: '60px' }}
                  width={{ base: '80px', md: '100px' }}
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mt={{ base: 2, md: 0 }}
                  ml={{ base: 0, md: 4 }}
                  alignSelf={{ base: 'center', md: 'center' }}
                  mb={{ base: 0, md: '2px' }}
                >
                  <Image
                    src={`data:${fileType};base64,${preview}`}
                    alt={t('ui.logo_preview')}
                    maxHeight="50px"
                    objectFit="contain"
                    _hover={{ transform: 'none' }}
                  />
                  <IconButton
                    aria-label={t('ui.remove_logo')}
                    icon={<RxCrossCircled size={18} />}
                    size="xs"
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    minW={6}
                    h={6}
                    borderRadius="full"
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    color="red.500"
                    _hover={{ bg: 'white' }}
                    _active={{ bg: 'white' }}
                    onClick={clearLogo}
                    boxShadow="sm"
                    isDisabled={!hasEditPermission}
                  />
                </Box>
              )}
            </Flex>
          </FormControl>
        </Stack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!isEmpty(errors.connectionType)} flex={1} isDisabled>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.connectionType')}</FormLabel>
            <Controller
              name="connectionType"
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" isReadOnly/>
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.connectionType?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.connectedParticipants)} flex={1} isDisabled>
            <FormLabel fontSize="sm" fontWeight="semibold">{t('ui.connectedParticipants')}</FormLabel>
            <Controller
              name='connectedParticipants'
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" isReadOnly />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.connectedParticipants?.message}</FormErrorMessage>
          </FormControl>
        </Stack>

        {hasEditPermission && (
          <Flex justify="flex-end" mt={6} pt={4} borderTopWidth="1px" borderColor="gray.100">
            <Button
              isDisabled={isSubmitting || !isDirty || !isValid}
              isLoading={isSubmitting}
              onClick={handleSubmit(organizationHandler)}
              colorScheme="blue"
              type="submit"
              size="md"
              minW="120px"
            >
              {t('ui.save_profile')}
            </Button>
          </Flex>
        )}
      </VStack>
    </Box>
  );
};

export default OrganizationProfile;
