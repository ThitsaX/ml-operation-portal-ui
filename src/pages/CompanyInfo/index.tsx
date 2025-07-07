import { useState, memo, useCallback } from 'react'
import {
  Flex,
  Heading,
  Input,
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  SimpleGrid,
  Button,
  useToast,
  HStack,
  VStack
} from '@chakra-ui/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isEmpty } from 'lodash-es'
import { modifyParticipant } from '@services/company-info'
import { CompanyInfoHelper } from '@helpers/form'
import { useGetParticipant } from '@hooks/services'
import { type IGetParticipant } from '@typescript/services/company-info'
import { getRequestErrorMessage } from '@helpers/errors'
import { type IApiErrorResponse } from '@typescript/services'
import { useLoadingContext } from '@contexts/hooks'
import { IoCheckmarkOutline, IoCreateOutline } from 'react-icons/io5'

const companyInfoHelper = new CompanyInfoHelper()

const CompanyInfo = (): JSX.Element => {
  const toast = useToast()
  const { start, complete } = useLoadingContext()

  /* State */
  const [isEditing, setIsEditing] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<IGetParticipant>({
    resolver: zodResolver(companyInfoHelper.schema),
    mode: 'onChange'
  })

  const { fields: contactListFields } = useFieldArray({
    control,
    name: 'contact_info_list' // unique name for your Field Array
  })

  const { fields: extraPropertyFields } = useFieldArray({
    control,
    name: 'extra_property_list' // unique name for your Field Array
  })

  /* React Query */
  const { data, refetch } = useGetParticipant({
    onSuccess (data) {
      reset(data)
    }
  })

 /* Handlers */
  const onEditHandler = useCallback(
    (values: IGetParticipant) => {
      if (isEditing) {
        start()
        modifyParticipant(values)
          .then(() => {
            toast({
              position: 'top',
              status: 'success',
              description: 'Successfully updated.',
              isClosable: true,
              duration: 3000
            })
            refetch()
            reset(values)
          })
          .catch((err: IApiErrorResponse) => {
            toast({
              position: 'top',
              description: getRequestErrorMessage(err),
              status: 'error',
              isClosable: true,
              duration: 3000
            })
            reset(data)
          })
          .finally(() => { complete() })
        setIsEditing(false)
      } else {
        setIsEditing(true)
      }
    }, [complete, isEditing, reset, start, toast]
  )

  const onCancelClick = useCallback(() => {
      setIsEditing(false)
      refetch()
      reset(data)
  }, [data, reset])

  return (
    <VStack align="stretch" w="full" h="full" p="3" spacing={4}>
      <HStack justifyContent="space-between">
        <Heading color="trueGray.600" fontSize="1.5em" textAlign="left">
          Company Profile
        </Heading>
        <Flex gap="3">
          <Button
            onClick={handleSubmit(onEditHandler)}
            isDisabled={!isValid || (isEditing && !isDirty)}
            colorScheme="brand"
            pr="3"
            gap="2"
            size="sm"
          >
            {isEditing ? <IoCheckmarkOutline /> : <IoCreateOutline />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
          <Button
            onClick={onCancelClick}
            display={`${isEditing ? 'inline' : 'none'}`}
            size="sm"
          >
            Cancel
          </Button>
        </Flex>
      </HStack>

      <VStack align="stretch" bg="white" gap="2">
        <SimpleGrid columns={{ sm: 2, md: 3 }} gap={6}>
          <Box borderRadius="lg" overflow="hidden" p="3">
            <FormControl isInvalid={!isEmpty(errors.name)} isRequired pb="1">
              <FormLabel>Company Name</FormLabel>
              <Input {...register('name')} disabled={!isEditing} />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!isEmpty(errors.address)} isRequired pb="1">
              <FormLabel>Address</FormLabel>
              <Input {...register('address')} disabled={!isEditing} />
              <FormErrorMessage>{errors.address?.message}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!isEmpty(errors.mobile)} isRequired pb="1">
              <FormLabel>Company Phone</FormLabel>
              <Input {...register('mobile')} disabled={!isEditing} />
              <FormErrorMessage>{errors.mobile?.message}</FormErrorMessage>
            </FormControl>
          </Box>

          {contactListFields.map((contactField, index) => (
            <Box
              flex={1}
              borderRadius="lg"
              overflow="hidden"
              p="3"
              key={`B${index}`}
            >
              <FormControl
                pb="1"
                key={`FC1${contactField.id}`}
              >
                <FormLabel>{contactField.contact_type} Contact Name</FormLabel>
                <Input
                  {...register(`contact_info_list.${index}.name`)}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormControl
                pb="1"
                key={`FC2${contactField.id}`}
              >
                <FormLabel>Position</FormLabel>
                <Input
                  {...register(`contact_info_list.${index}.title`)}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormControl
                pb="1"
                key={`FC3${contactField.id}`}
              >
                <FormLabel>Email Address</FormLabel>
                <Input
                  {...register(`contact_info_list.${index}.email`)}
                  disabled={!isEditing}
                />
              </FormControl>
              <FormControl
                pb="1"
                key={`FC4${contactField.id}`}
              >
                <FormLabel>{contactField.contact_type} Contact Phone</FormLabel>
                <Input
                  {...register(`contact_info_list.${index}.mobile`)}
                  disabled={!isEditing}
                />
              </FormControl>
            </Box>
          ))}
        </SimpleGrid>

        <VStack align="stetch" borderRadius="xl" p="3" borderWidth="1px">
          <Box
            display="flex"
            alignItems="baseline"
            justifyContent="space-between"
          >
            <Heading color="trueGray.600" fontSize="1.5em" textAlign="left">
              Liquidity Profile
            </Heading>
          </Box>
          <Box maxW="md" borderRadius="lg" overflow="hidden" p="3">
            <Flex direction={'column'}>
              {extraPropertyFields.map((extraProperty, index) => (
                <FormControl
                  pb="1"
                  key={extraProperty.id}
                >
                  <FormLabel>{extraProperty.label}</FormLabel>
                  <Input
                    {...register(`extra_property_list.${index}.property_value`)}
                    disabled={true}
                  />
                </FormControl>
              ))}
            </Flex>
          </Box>
        </VStack>
      </VStack>
    </VStack>
  )
}

export default memo(CompanyInfo)
