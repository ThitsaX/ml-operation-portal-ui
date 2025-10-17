import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Select,
  useToast,
  VStack
} from '@chakra-ui/react'
import { useLoadingContext } from '@contexts/hooks'
import { getErrorMessage } from '@helpers/errors'
import { ParticipantHelper } from '@helpers/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { modifyParticipantUser } from '@services/participant'
import { useGetUserState } from '@store/hooks'
import {
  type IApiErrorResponse,
  type IParticipantUser
} from '@typescript/services'
import { type IModifyUserValues } from '@typescript/form'
import { isEmpty, trim } from 'lodash-es'
import { memo, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'

const participantUser = new ParticipantHelper()

export interface IModifyUserProps {
  data: IParticipantUser
  onSave?: (data: IParticipantUser) => void
}

const EditUser = ({ data, onSave }: IModifyUserProps): JSX.Element => {
  const toast = useToast()

  /* Redux */
  const user = useGetUserState()

  /* Context */
  const { start, complete } = useLoadingContext()

  /* Form */
  const {
    setFocus,
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty }
  } = useForm<IModifyUserValues & { confirm_password: string }>({
    defaultValues: {
      ...data,
      participant_id: user.data?.participantId
    },
    mode: 'onChange',
    resolver: zodResolver(participantUser.editUserSchema)
  })

  /* Handlers */
  const onSubmitHandler = useCallback(
    ({
      confirm_password: _confirmPassword,
      ...values
    }: IModifyUserValues & { confirm_password: string }) => {
      // values
      values = {
        ...values,
        name: `${trim(values.first_name)} ${trim(values.last_name)}`,
        participant_id: user.data?.participantId as string
      }
      // perform api stuffs here
      start()
      modifyParticipantUser(values)
        .then(() => {
          toast({
            position: 'top',
            description: 'user-edited-successfully',
            status: 'success',
            isClosable: true,
            duration: 3000
          })
          onSave?.({
            ...data,
            ...values
          })
        })
        .catch((err: IApiErrorResponse) =>
          toast({
            position: 'top',
            description: getErrorMessage(err),
            status: 'error',
            isClosable: true,
            duration: 3000
          })
        )
        .finally(() => {
          complete()
        })
    },
    [complete, data, onSave, start, toast, user.data?.participantId]
  )

  useEffect(() => {
    setFocus('first_name')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <VStack
      align="flex-start"
      bg="white"
      maxW="500px"
      borderRadius="xl"
      spacing="4">
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
      <FormControl isInvalid={!isEmpty(errors.email)}>
        <FormLabel>Email</FormLabel>
        <Input type="text" {...register('email')} isDisabled />
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
          <Input type="text" value={user.data?.participantName} isReadOnly />
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
        <FormControl isInvalid={!isEmpty(errors.userRoleType)}>
          <FormLabel>Roles</FormLabel>
          <Select {...register('userRoleType')}>
            <option value="ADMIN">Admin</option>
            <option value="OPERATION">Operation</option>
          </Select>
          <FormErrorMessage>{errors.userRoleType?.message}</FormErrorMessage>
        </FormControl>
      </HStack>
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
    </VStack>
  )
}

export default memo(EditUser)
