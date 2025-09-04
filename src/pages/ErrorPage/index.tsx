import { Text, Heading, VStack, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
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

      <Button as={Link} to="/" colorScheme="blue" variant="link">
        Return Home
      </Button>
    </VStack>
  )
}

export default memo(ErrorPage)
