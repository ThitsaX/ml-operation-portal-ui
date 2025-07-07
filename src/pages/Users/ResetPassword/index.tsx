import {
  Button,
  ButtonGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  useToast,
  VStack
} from '@chakra-ui/react'
import { useLoadingContext } from '@contexts/hooks'
import { getRequestErrorMessage } from '@helpers/errors'
import { ParticipantHelper } from '@helpers/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordUser } from '@services/participant'
import { type IResetPasswordValues } from '@typescript/form'
import { type IApiErrorResponse } from '@typescript/services'
import { isEmpty } from 'lodash-es'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'

const participantHelper = new ParticipantHelper()

export interface IResetPasswordProps {
  data: { email: string }
  onSave?: (data: { email: string }) => void
  onCancel: () => void
}

const ResetPassword = ({ data, onSave, onCancel }: IResetPasswordProps): JSX.Element => {
  const toast = useToast()

  /* Context */
  const { start, complete } = useLoadingContext()

  /* Form */
  const {
    setFocus,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty }
  } = useForm<IResetPasswordValues & { confirm_password: string }>({
    defaultValues: {
      ...data,
      new_password: ''
    },
    mode: 'onChange',
    resolver: zodResolver(participantHelper.resetPasswordSchema)
  })

  /* Handlers */
  const onSubmitHandler = useCallback(
    ({
      confirm_password: _confirm_password,
      ...values
    }: IResetPasswordValues & { confirm_password: string }) => {
      // values
      values = {
        ...values
      }
      // perform api stuffs here
      start()
      resetPasswordUser(values)
        .then(() => {
          toast({
            position: 'top',
            description: 'reset-password-successfully',
            status: 'success',
            isClosable: true,
            duration: 3000
          })
          onSave?.({
            ...data
          })
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
          complete()
        })
    },
    [complete, data, onSave, start, toast]
  )

  const handleCancel = ()=> {
    onCancel();
  }

  useEffect(() => {
    setFocus('new_password')
  }, [])
  return (
    <VStack
      align="flex-start"
      bg="white"
      maxW="500px"
      borderRadius="xl"
      spacing="4">
      <FormControl isInvalid={!isEmpty(errors.email)}>
        <FormLabel>Email</FormLabel>
        <Input type="text" {...register('email')} isDisabled />
        <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.new_password)} isRequired>
        <FormLabel>New Password</FormLabel>
        <Input type="password" {...register('new_password')} />
        <FormErrorMessage>{errors.new_password?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isInvalid={!isEmpty(errors.confirm_password)} isRequired>
        <FormLabel>Confirm Password</FormLabel>
        <Input type="password" {...register('confirm_password')} />
        <FormErrorMessage>{errors.confirm_password?.message}</FormErrorMessage>
      </FormControl>

      <ButtonGroup spacing="4" alignSelf="stretch">
        <Button variant="ghost" colorScheme="muted" flex={1} onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          color="white"
          bg="primary"
          flex={1}
          isDisabled={!isDirty || !isValid}
          _hover={{
            bg: 'primary',
            opacity: 0.4
          }}
          onClick={handleSubmit(onSubmitHandler)}>
          Save
        </Button>
      </ButtonGroup>
    </VStack>
  )
}

export default ResetPassword
