import { useState, useEffect, memo, useCallback } from 'react'
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
  useToast
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

const authHelper = new AuthHelper()

const ChangePassword = () => {
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
    onSuccess: () => {
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
      old_password: '',
      new_password: '',
      confirm_password: ''
    })
  }, [reset])

  // Use effect hook
  useEffect(() => {
    setFocus('old_password')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Flex justify="center" flexDirection="column" flex={1} p="5">
      <Box mb="8">
        <Heading color="trueGray.600" fontSize="2xl" textAlign="center">
          Change Password
        </Heading>
      </Box>

      <Flex justify="center" flexDirection="column" w="md" p="5" gap="8">
        <FormControl
          isInvalid={!isEmpty(formState.errors.old_password)}
          isRequired>
          <FormLabel>Old Password</FormLabel>
          <InputGroup>
            <Input
              {...register('old_password')}
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
                  setShowPassword(!showPassword)
                }}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>
            {formState.errors.old_password?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl
          isInvalid={!isEmpty(formState.errors.new_password)}
          isRequired>
          <FormLabel>New Password</FormLabel>
          <InputGroup>
            <Input
              {...register('new_password')}
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
                  setShowPassword(!showPassword)
                }}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>
            {formState.errors.new_password?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl
          isInvalid={!isEmpty(formState.errors.confirm_password)}
          isRequired>
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
                  setShowPassword(!showPassword)
                }}
              />
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>
            {formState.errors.confirm_password?.message}
          </FormErrorMessage>
        </FormControl>

        <Flex gap={5} flex={1}>
          <Button
            w="full"
            color="white"
            bg="primary"
            isDisabled={!formState.isDirty || !formState.isValid}
            _hover={{
              bg: 'primary',
              opacity: 0.4
            }}
            onClick={handleSubmit(onSubmitHandler)}>
            Submit
          </Button>

          <Button
            w="full"
            isDisabled={!formState.isDirty}
            onClick={onCancelHandler}>
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}

export default memo(ChangePassword)
