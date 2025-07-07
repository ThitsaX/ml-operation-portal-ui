import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useLoadingContext } from '@contexts/hooks';
import { getRequestErrorMessage } from '@helpers/errors';
import { ParticipantHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNewParticipantUser } from '@services/participant';
import { useGetUserState } from '@store/hooks';
import { type IApiErrorResponse } from '@typescript/services';
import { type ICreateUserValues } from '@typescript/form';
import { isEmpty, trim } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';

const participantHelper = new ParticipantHelper();

const CreateUser = () => {
  const toast = useToast();

  /* Redux */
  const user = useGetUserState();

  /* Context */
  const { start, complete } = useLoadingContext();
  /* State */
  const [showPassword, setShowPassword] = useState(false);

  /* Form */
  const {
    setFocus,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<ICreateUserValues & { confirm_password: string }>({
    defaultValues: {
      participant_id: user.data?.participant_id,
      email: '',
      password: '',
      confirm_password: '',
      name: '',
      first_name: '',
      last_name: '',
      job_title: '',
      user_role_type: 'ADMIN',
      status: 'ACTIVE'
    },
    mode: 'onChange',
    resolver: zodResolver(participantHelper.registerSchema)
  });

  /* Handlers */
  const onSubmitHandler = useCallback(
    ({
      confirm_password: _confirmPassword,
      ...values
    }: ICreateUserValues & { confirm_password: string }) => {
      // values
      values = {
        ...values,
        name: `${trim(values.first_name)} ${trim(values.last_name)}`,
        participant_id: user.data?.participant_id as string
      };
      // perform api stuffs here
      start();
      createNewParticipantUser(values)
        .then(() => {
          toast({
            position: 'top',
            description: 'user-created-successfully',
            status: 'success',
            isClosable: true,
            duration: 3000
          });
          reset();
        })
        .catch((err: IApiErrorResponse) =>
          toast({
            position: 'top',
            description: getRequestErrorMessage(err),
            status: 'error',
            isClosable: true,
            duration: 3000
          })
        )
        .finally(() => {
          complete();
        });
    },
    [complete, reset, start, toast, user.data?.participant_id]
  );

  const onCancelHandler = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    setFocus('first_name');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4}>
      <VStack
        align="flex-start"
        bg="white"
        maxW="500px"
        borderRadius="xl"
        spacing="3">
        <Box>
          <Heading fontSize="3xl">Create User</Heading>
        </Box>
        <HStack align="flex-start" w="full" spacing="3">
          <FormControl isInvalid={!isEmpty(errors.first_name)} isRequired>
            <FormLabel>First Name</FormLabel>
            <Input type="text" {...register('first_name')} />
            <FormErrorMessage>{errors.first_name?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.last_name)} isRequired>
            <FormLabel>Last Name</FormLabel>
            <Input type="text" {...register('last_name')} />
            <FormErrorMessage>{errors.last_name?.message}</FormErrorMessage>
          </FormControl>
        </HStack>
        <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="text" {...register('email')} />
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
        </FormControl>
        <HStack align="flex-start" w="full" spacing="3">
          <FormControl isInvalid={!isEmpty(errors.job_title)} isRequired>
            <FormLabel>Job Title</FormLabel>
            <Input type="text" {...register('job_title')} />
            <FormErrorMessage>{errors.job_title?.message}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Organization</FormLabel>
            <Input type="text" value={user.data?.dfsp_code} isReadOnly />
          </FormControl>
        </HStack>
        <HStack align="flex-start" w="full" spacing="3">
          <FormControl isInvalid={!isEmpty(errors.status)}>
            <FormLabel>Is Active?</FormLabel>
            <Select {...register('status')}>
              <option value="ACTIVE">Yes</option>
              <option value="INACTIVE">No</option>
            </Select>
            <FormErrorMessage>{errors.first_name?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.user_role_type)}>
            <FormLabel>Roles</FormLabel>
            <Select {...register('user_role_type')}>
              <option value="ADMIN">Admin</option>
              <option value="OPERATION">Operation</option>
            </Select>
            <FormErrorMessage>
              {errors.user_role_type?.message}
            </FormErrorMessage>
          </FormControl>
        </HStack>

        <FormControl isInvalid={!isEmpty(errors.password)} isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
            />
            <InputRightElement>
              <IconButton
                icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                aria-label="Show Password"
                bg="transparent"
                rounded="full"
                _hover={{
                  bg: 'transparent'
                }}
                onClick={() => {
                  setShowPassword(!showPassword);
                }}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!isEmpty(errors.confirm_password)} isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              {...register('confirm_password')}
              type={showPassword ? 'text' : 'password'}
            />
            <InputRightElement>
              <IconButton
                icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                aria-label="Show Password"
                bg="transparent"
                rounded="full"
                _hover={{
                  bg: 'transparent'
                }}
                onClick={() => {
                  setShowPassword(!showPassword);
                }}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>
            {errors.confirm_password?.message}
          </FormErrorMessage>
        </FormControl>

        <Flex gap={5} w="full">
          <Button
            color="white"
            bg="primary"
            w="full"
            isDisabled={!isDirty || !isValid}
            _hover={{
              bg: 'primary',
              opacity: 0.4
            }}
            onClick={handleSubmit(onSubmitHandler)}>
            Save
          </Button>

          <Button w="full" isDisabled={!isDirty} onClick={onCancelHandler}>
            Cancel
          </Button>
        </Flex>
      </VStack>
    </VStack>
  );
};

export default CreateUser;
