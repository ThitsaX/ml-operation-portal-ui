import { Text, Heading, VStack, Button } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export interface IErrorPageProps {
  title?: string
  message: string
}

const ErrorPage = ({ title, message }: IErrorPageProps) => {
  const { t } = useTranslation()

  return (
    <VStack flex={1} justify="center" align="center">
      <Heading textAlign="center">{title || t('ui.oops')}</Heading>
      <Text textAlign="center" color="gray.500">
        {message || t('ui.an_unknown_error_occurred')}
      </Text>

      <Button as={Link} to="/" colorScheme="blue" variant="link">
        {t('ui.return_home')}
      </Button>
    </VStack>
  )
}

export default memo(ErrorPage)
