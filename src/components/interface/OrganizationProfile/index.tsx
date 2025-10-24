import React, { useState, useEffect } from 'react';
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
};

const OrganizationProfile: React.FC<OrganizationProfileProps> = ({ participantId }) => {

  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
            title: 'Error',
            description: getErrorMessage(err) || 'Failed to load profile',
            status: 'error',
          });
        }).finally(() => setIsLoading(false));
    }
  }, [participantId, reset, setValue, toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString();
        const base64String = result?.split(',')[1] ?? null;

        setPreview(base64String);
        setValue('logo', base64String ?? '', {
          shouldValidate: true,
          shouldDirty: true
        });
        setValue('logoFileType', file.type, {
          shouldValidate: true,
          shouldDirty: true
        });
      };
      reader.readAsDataURL(file);
    }
  };


  const organizationHandler = async (values: IParticipantProfile) => {
    setIsSubmitting(true);
    try {
      await modifyParticipant(values);
      toast({
        title: 'Profile updated',
        position: 'top',
        description: 'Organization profile updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      reset(values);
    } catch (error: any) {
      const err = error as IApiErrorResponse;
      toast({
        title: 'Update failed',
        position: 'top',
        description: getErrorMessage(err) || 'Failed to update organization profile.',
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
      <Heading fontSize="lg" fontWeight="bold" mb={4}>
        Organization Profile
      </Heading>

      <VStack spacing={4} align="stretch" opacity={isLoading ? 0.5 : 1} pointerEvents={isLoading ? 'none' : 'auto'}>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!isEmpty(errors.description)}>
            <FormLabel fontSize="sm" fontWeight="semibold">Description</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.description?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.address)}>
            <FormLabel fontSize="sm" fontWeight="semibold">Address</FormLabel>
            <Controller
              name='address'
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.address?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.mobile)}>
            <FormLabel fontSize="sm" fontWeight="semibold">Contact Number</FormLabel>
            <Controller
              name='mobile'
              control={control}
              render={({ field }) => (
                <Input {...field} fontSize="md" />
              )}
            />
            <FormErrorMessage fontSize="xs">{errors.mobile?.message}</FormErrorMessage>
          </FormControl>
        </Stack>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="semibold">Logo</FormLabel>
            <Input
              type="file"
              accept="image/*"
              fontSize="md"
              pt={1}
              onChange={handleFileChange}
            />
            {/* Hidden inputs to store base64 and fileType in react-hook-form */}
            <input type="hidden" {...register('logo')} />
            <input type="hidden" {...register('logoFileType')} />
          </FormControl>

          {preview && (
            <Box
              border="1px solid"
              borderColor="gray.300"
              borderRadius="md"
              p={1}
              bg="gray.50"
              height="60px"
              width="100px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={`data:${fileType};base64,${preview}`}
                alt="Logo Preview"
                maxHeight="50px"
                objectFit="contain"
              />
            </Box>
          )}
        </Flex>

        <Box textAlign="right" pt={2}>
          <Button
            isDisabled={isSubmitting || !isDirty || !isValid}
            isLoading={isSubmitting}
            onClick={handleSubmit(organizationHandler)}
            colorScheme="blue"
            type="submit"
            size="sm"
          >
            Save Profile
          </Button>

        </Box>
      </VStack>
    </Box>
  );
};

export default OrganizationProfile;
