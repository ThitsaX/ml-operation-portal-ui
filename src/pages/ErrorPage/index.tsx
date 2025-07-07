import { Text, Heading, VStack } from '@chakra-ui/react'
import { memo } from 'react'

export interface IErrorPageProps {
  title?: string
  message: string
}

const ErrorPage = ({ title, message }: IErrorPageProps) => {
  return (
    <VStack flex={1} justify="center" align="center">
      <Heading textAlign="center">{title || 'Oops!'}</Heading>
      <Text textAlign="center" color="gray.500">
        {message || 'Unknown error thown.'}
      </Text>
    </VStack>
  )
}

export default memo(ErrorPage)
