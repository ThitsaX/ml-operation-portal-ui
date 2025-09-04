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
import { useGetParticipantProfile } from '@hooks/services/participant';
import { IParticipantProfile } from '@typescript/services';
import { modifyParticipant } from '@services/participant';
import { OrganizationHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEmpty } from 'lodash-es'

const OrganizationProfile = () => {
  const { data } = useGetParticipantProfile();
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


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
    defaultValues: undefined,
    resolver: zodResolver(organizationHelper.schema),
    mode: 'onChange',
  });


  useEffect(() => {
    if (data) {
      reset(data);
      setFileType(data.logoFileType);
      setPreview(data.logo);
    }
  }, [data, reset]);

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
        description: 'Organization profile updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      reset(values);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong.',
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
      <Heading fontSize="lg" mb={4}>
        Organization Profile
      </Heading>

      <VStack spacing={4} align="stretch">

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <FormControl isInvalid={!isEmpty(errors.description)}>
            <FormLabel>Description</FormLabel>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ''} />
              )}
            />
            <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.address)}>
            <FormLabel fontSize="sm">Address</FormLabel>
            <Input
              type="input"
              {...register('address')}
              fontSize="sm"
            />
            <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!isEmpty(errors.mobile)}>
            <FormLabel fontSize="sm">Contact Number</FormLabel>
            <Input
              type="input"
              {...register('mobile')}
              fontSize="sm"
            />
            <FormErrorMessage>{errors.mobile?.message}</FormErrorMessage>
          </FormControl>
        </Stack>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
          <FormControl>
            <FormLabel fontSize="sm">Logo</FormLabel>
            <Input
              type="file"
              accept="image/*"
              fontSize="sm"
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
