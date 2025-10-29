import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
} from '@chakra-ui/react';
import moment from 'moment';
import { useGetAllAnnouncement } from '@hooks/services';

const Home = () => {

  /* React Query */
  const { data: announcements = [] } = useGetAllAnnouncement();

function changeDateMonthFormat(timestamp: number) {
    return moment.utc(timestamp * 1000).format('MMM');
  }

  function changeDateDayFormat(timestamp: number) {
    return moment.utc(timestamp * 1000).format('DD');
  }


  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>Home</Heading>

      <VStack
        align="flex-start"
        border="1px"
        borderColor="gray.200"
        borderRadius="md"
        px={4}
        py={3}
        mt={2}
        w="full"
        spacing={2}
        mb={8}
      >
        <Heading as="h2" fontSize="xl" fontWeight="bold" color="black.200">
          Welcome to the Operation Portal!
        </Heading>
        <Text fontSize="md" color="gray.700">
          This is the main page of the portal. Use the navigation on the left to access different sections and perform various operations.
        </Text>
      </VStack>
      <Box h={8} />

      <Heading
        as="h3"
        fontSize="lg"
        fontWeight="bold"
        mb={8}
        alignSelf="flex-start"
        color="black.600"
      >
        Latest Announcement
      </Heading>

      <VStack align="flex-start" bg="white" w="full" spacing={2} mb={8}>
        {announcements.map((announcement: any, index: number) => (
          <HStack
            key={index}
            borderRadius="md"
            p={4}
            border="1px"
            borderColor="gray.300"
            align="flex-start"
            spacing={4}
            w="full"
          >
            <Box
              minW="48px"
              textAlign="center"
              bg="gray.100"
              borderRadius="md"
              border="1px"
              borderColor="gray.300"
              p={1}
              mr={2}
            >
              <Text fontWeight="bold" fontSize="sm" color="black.600">
                {changeDateMonthFormat(announcement.date)}
              </Text>
              <Text fontSize="lg" color="gray.800" lineHeight="1">
                {changeDateDayFormat(announcement.date)}
              </Text>
            </Box>

            <VStack align="flex-start" spacing={1}>
              <Text fontWeight="bold" fontSize="md" color="gray.600">
                {announcement.title}
              </Text>
              <Box
                fontSize="sm"
                color="gray.700"
                dangerouslySetInnerHTML={{ __html: announcement.detail }}
              />
            </VStack>
          </HStack>
        ))}
      <Box h={8} />
      </VStack>
    </VStack>
  );
};

export default Home;
