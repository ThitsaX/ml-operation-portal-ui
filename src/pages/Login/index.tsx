import { useState, useEffect, memo, useCallback } from 'react';
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  Box,
  IconButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  VStack
} from '@chakra-ui/react';
import { type ISignInValues } from '@typescript/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthHelper } from '@helpers/form';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { isEmpty } from 'lodash-es';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@store';
import { UserActions } from '@store/features/user';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';

const authHelper = new AuthHelper();

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();

  /* Redux */
  const dispatch = useAppDispatch();

  /* State */
  const [showPassword, setShowPassword] = useState(false);

  /* Form */
  const {
    setFocus,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<ISignInValues>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange',
    resolver: zodResolver(authHelper.loginSchema)
  });

  /* Handlers */
  const onSubmitHandler = useCallback((values: ISignInValues) => {
    // perform api stuffs here
    dispatch(UserActions.login(values))
      .unwrap()
      .then(() => {
        navigate('/home', { replace: true });
      })
      .catch((e: IApiErrorResponse) => {
        toast({
          position: 'top',
          description: getErrorMessage(e) || 'Login failed',
          status: 'error',
          isClosable: true,
          duration: 3000
        });
        reset();
      });
  }, []);

  useEffect(() => {
    setFocus('email');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex
      justify="center"
      align="center"
      flexDir="column"
      flex={1}
      bg="primary">
      <Box mb="10">
        <Heading color="white" fontSize="2xl" textAlign="center">
          Operation Portal
        </Heading>
      </Box>

      <form onSubmit={handleSubmit(onSubmitHandler)}>
        <VStack
          align="stretch"
          bg="white"
          w="400px"
          borderRadius="xl"
          p="5"
          spacing="3"
          zIndex={1}>
          <Box>
            <Heading color="trueGray.600" fontSize="m" textAlign="center">
              Sign In to your account
            </Heading>
          </Box>
          <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" {...register('email')} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>
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
          <Button
            type="submit"
            color="white"
            bg="primary"
            isDisabled={!isDirty || !isValid}
            _hover={{
              bg: 'primary',
              opacity: 0.4
            }}>
            Sign in
          </Button>
        </VStack>
      </form>
    </Flex>
  );
};

export default memo(Login);
