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
  VStack,
  HStack
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
import { useTranslation } from 'react-i18next';
import LanguageDropdown from '@components/common/LanguageDropdown';

const authHelper = new AuthHelper();

const Login = () => {
  const { t, i18n } = useTranslation();
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
          description: getErrorMessage(e) || t('ui.login_failed'),
          status: 'error',
          isClosable: true,
          duration: 3000
        });
        reset();
      });
  }, [dispatch, navigate, reset, toast, t]);


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
          {t('ui.operation_portal')}
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
          <HStack justify="flex-end">
            <LanguageDropdown size="xs" showCode={true} showName={false} />
          </HStack>
          <Box>
            <Heading color="trueGray.600" fontSize="m" textAlign="center">
              {t('ui.sign_in_to_your_account')}
            </Heading>
          </Box>
          <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
            <FormLabel>{t('ui.email')}</FormLabel>
            <Input type="email" {...register('email')} />
            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!isEmpty(errors.password)} isRequired>
            <FormLabel>{t('ui.password')}</FormLabel>
            <InputGroup>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
              />
              <InputRightElement>
                <IconButton
                  icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  aria-label={t('ui.show_password_aria')}
                  bg="transparent"
                  rounded="full"
                  size="sm"
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
            {t('ui.sign_in')}
          </Button>
        </VStack>
      </form>
    </Flex>
  );
};

export default memo(Login);
