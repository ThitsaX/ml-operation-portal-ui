import { useState, useEffect, memo, useCallback } from 'react'
import {
  Flex,
  Heading,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  IconButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  VStack
} from '@chakra-ui/react'
import { type IChangePwdValues } from '@typescript/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthHelper } from '@helpers/form'
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5'
import { isEmpty } from 'lodash-es'
import { useMutation } from '@tanstack/react-query'
import { type IApiErrorResponse } from '@typescript/services'
import { changePassword } from '@services/change-password'
import { getRequestErrorMessage } from '@helpers/errors'
import { useLoadingContext } from '@contexts/hooks'
import { useAppDispatch } from '@store';
import { IAuthResponse } from '@typescript/services';
import { UserActions } from '@store/features/user';

const authHelper = new AuthHelper()

const ChangePassword = () => {

  const dispatch = useAppDispatch();
  const toast = useToast()
  const { start, complete } = useLoadingContext()

  // States
  const [showPassword, setShowPassword] = useState(false)

  // Form
  const { setFocus, register, handleSubmit, reset, formState } =
    useForm<IChangePwdValues>({
      mode: 'onChange',
      resolver: zodResolver(authHelper.passwordChangeSchema)
    })

  // React Query
  const { mutate } = useMutation(changePassword, {
    onMutate: () => {
      start()
    },
    onSuccess: (data: IAuthResponse) => {
      dispatch(UserActions.updateAuth(data));
      toast({
        position: 'top',
        title: 'Success',
        description: 'Password change successful',
        status: 'success',
        isClosable: true,
        duration: 3000
      })

      onCancelHandler()
    },
    onError: (err: IApiErrorResponse) => {
      console.log(err)

      toast({
        position: 'top',
        title: getRequestErrorMessage(err),
        status: 'error',
        isClosable: true,
        duration: 3000
      })
    },
    onSettled: () => {
      complete()
    }
  })

  // Handlers
  const onSubmitHandler = useCallback((values: IChangePwdValues) => {
    mutate(values)
  }, [])

  const onCancelHandler = useCallback(() => {
    reset({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }, [reset])

  // Use effect hook
  useEffect(() => {
    setFocus('oldPassword')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <VStack
      align="flex-start"
      h="full"
      p={{ base: 3, md: 6, lg: 10 }}
      mt={10}
      w="full"
      spacing={6}
    >

      <Heading
        fontSize={"2xl"}
        mb={6}
        textAlign={"center"}
        w="full"
      >
        Change Password
      </Heading>

      <VStack
        w={{
          base: "100%", 
          sm: "90%",         
          md: "md",           
          lg: "lg",
          xl: "xl"
        }}
        maxW="full"
        p={{ base: 4, md: 6, lg: 8 }}
        spacing={6}
        mx="auto"
        align="stretch"
      >
        {/* Old Password */}
        <FormControl isInvalid={!isEmpty(formState.errors.oldPassword)} isRequired>
          <FormLabel fontSize={{ base: "sm", md: "md" }}>Old Password</FormLabel>
          <InputGroup>
            <Input
              {...register("oldPassword")}
              type={showPassword ? "text" : "password"}
            />
            <InputRightElement>
              <IconButton
                icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                aria-label="Show Password"
                bg="transparent"
                rounded="full"
                size="sm"
                _hover={{ bg: "transparent" }}
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formState.errors.oldPassword?.message}</FormErrorMessage>
        </FormControl>

        {/* New Password */}
        <FormControl isInvalid={!isEmpty(formState.errors.newPassword)} isRequired>
          <FormLabel fontSize={{ base: "sm", md: "md" }}>New Password</FormLabel>
          <InputGroup>
            <Input
              {...register("newPassword")}
              type={showPassword ? "text" : "password"}
            />
            <InputRightElement>
              <IconButton
                icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                aria-label="Show Password"
                bg="transparent"
                rounded="full"
                size="sm"
                _hover={{ bg: "transparent" }}
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formState.errors.newPassword?.message}</FormErrorMessage>
        </FormControl>

        {/* Confirm Password */}
        <FormControl isInvalid={!isEmpty(formState.errors.confirmPassword)} isRequired>
          <FormLabel fontSize={{ base: "sm", md: "md" }}>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              {...register("confirmPassword")}
              type={showPassword ? "text" : "password"}
            />
            <InputRightElement>
              <IconButton
                icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                aria-label="Show Password"
                bg="transparent"
                rounded="full"
                size="sm"
                _hover={{ bg: "transparent" }}
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{formState.errors.confirmPassword?.message}</FormErrorMessage>
        </FormControl>

        {/* Action Buttons */}
        <Flex
          gap={{ base: 3, md: 4 }}
          flex={1}
          direction={{ base: "column", sm: "row" }}
          align="stretch"
        >
          <Button
            w="full"
            color="white"
            bg="primary"
            isDisabled={!formState.isDirty || !formState.isValid}
            _hover={{ bg: "primary", opacity: 0.85 }}
            onClick={handleSubmit(onSubmitHandler)}
          >
            Submit
          </Button>

          <Button
            w="full"
            isDisabled={!formState.isDirty}
            onClick={onCancelHandler}
          >
            Cancel
          </Button>
        </Flex>
      </VStack>
    </VStack >
  )
}

export default memo(ChangePassword)
