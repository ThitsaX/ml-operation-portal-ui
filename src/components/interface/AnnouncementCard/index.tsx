import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import { type AnnouncementInfo } from '@typescript/services'
import { memo } from 'react'

export interface IAnnouncementCardProps extends AnnouncementInfo {
  onClick?: (item: AnnouncementInfo) => void
}

const AnnouncementCard = ({ onClick, ...props }: IAnnouncementCardProps) => {
  const { date, title, detail } = props
  return (
    <Box
      h="44"
      bg="white"
      px="5"
      py="2.5"
      my="2"
      mx="1.5"
      rounded="xl"
      cursor="pointer"
      shadow="md"
      onClick={() => { (onClick != null) && onClick(props) }}
    >
      <VStack align="flex-start" spacing="2">
        <Box>
          <Heading fontSize="xl" noOfLines={1}>
            {title}
          </Heading>
          <Text fontWeight="medium" color="muted.500" fontSize="sm">
            {date}
          </Text>
        </Box>
        <Box>
          <Text noOfLines={4}>{detail}</Text>
        </Box>
      </VStack>
    </Box>
  )
}

export default memo(AnnouncementCard)
