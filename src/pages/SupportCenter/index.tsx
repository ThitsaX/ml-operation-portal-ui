import {
  Box,
  Heading,
  Flex,
  useToast,
  VStack,
  Text,
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Image,
  SimpleGrid,
} from '@chakra-ui/react';
import { getErrorMessage } from '@helpers/errors';
import { useState } from 'react';
import { TbGavel } from "react-icons/tb";
import { GrServices } from "react-icons/gr";
import { ImUsers } from "react-icons/im";
import { useGetParticipantList } from '@hooks/services/participant';
import { getContactList } from '@services/participant';
import { IBusinessContact, IParticipantProfile } from '@typescript/services';
import { SupportCard } from '@components/interface/SupportCenter';
import { type IApiErrorResponse } from '@typescript/services';

const SupportCenter = () => {
  const toast = useToast();

  const [selectedParticipant, setSelectedParticipant] = useState<IParticipantProfile>();
  const [contactList, setContactList] = useState<IBusinessContact[] | null>(null);

  // Data Fetching
  const { data: participantInfoList } = useGetParticipantList();

  // Modal Control
  const { isOpen: isListOpen, onOpen: onListOpen, onClose: onListClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  // Handlers
  const showParticipantContacts = async (participant: IParticipantProfile) => {
    setSelectedParticipant(participant);
    try {
      const data = await getContactList(participant.participantId);
      setContactList(data);
      onDetailOpen();
    } catch (err) {
      toast({
        position: 'top',
        description: getErrorMessage(err as IApiErrorResponse),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };


  return (
    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>Support Center</Heading>

      <Flex w="full" wrap="wrap" justify="center" gap={20} pb={6}>
        <SupportCard
          icon={<TbGavel size={60} />}
          title="Dispute"
          description="Raise an issue or challenge"
          actionLabel="Submit Dispute"
          href="https://www.thitsaworks.com/"
          color="orange.700"
          onClick={() => { }}
        />

        <SupportCard
          icon={<GrServices size={60} />}
          title="Service Request"
          description="Request assistance or information"
          actionLabel="Service Request"
          href="https://www.thitsaworks.com/"
          color="blue.700"
          onClick={() => { }}
        />

        <SupportCard
          icon={<ImUsers size={60} />}
          title="Support Contacts"
          description="View focal contacts for support"
          actionLabel="View List"
          onClick={onListOpen}
          color="gray.600"
        />
      </Flex>


      <Modal isOpen={isListOpen} onClose={onListClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent
          maxW={{ base: "95%", md: "720px" }}
          maxH="90vh"
          display="flex"
          flexDirection="column"
          borderRadius="lg">
          <ModalHeader>
            DFSP List
          </ModalHeader>
          <ModalCloseButton zIndex={3} />

          <ModalBody
            flex="1"
            overflowY="auto"
            px={4}
            py={4}
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                background: "#CBD5E0",
                borderRadius: "24px",
              },
            }}
          >
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing={4}
            >
              {participantInfoList?.map((p, i) => (
                <Box
                  key={i}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  p={3}
                  textAlign="center"
                  boxShadow="sm"
                  cursor="pointer"
                  onClick={() => showParticipantContacts(p)}
                  _hover={{ boxShadow: "md", transform: "scale(1.02)" }}
                  transition="transform 0.15s ease"
                  bg="white"
                  willChange="transform"
                >
                  <Image
                    src={`data:${p.logoFileType};base64,${p.logo}`}
                    alt={p.description}
                    boxSize={{ base: "56px", md: "60px" }}
                    objectFit="cover"
                    borderRadius="full"
                    mx="auto"
                    mb={2}
                  />
                  <Text fontWeight="medium" fontSize="sm" noOfLines={2}>
                    {p.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' onClick={onListClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={onDetailClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Contact List
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center" maxH="70vh" overflowY="auto">

            <Flex align="center" mb={6}>
              <Image
                src={`data:${selectedParticipant?.logoFileType};base64,${selectedParticipant?.logo}`}
                alt={selectedParticipant?.description}
                boxSize="60px"
                objectFit="cover"
                borderRadius="full"
                mr={4}
              />
              <Text fontWeight="bold" fontSize="lg">
                {selectedParticipant?.description || 'Participant'}
              </Text>
            </Flex>
            {contactList?.map((info, index) => (
              <Box key={index} p={4}>
                <Text fontWeight="bold" fontSize="lg" mb={4}>
                  {info.contactType}
                </Text>
                <VStack spacing={2} align="start">
                  <Text><b>Contact Person Name:</b> {info?.name}</Text>
                  <Text><b>Position:</b> {info?.position}</Text>
                  <Text><b>Email:</b> {info?.email}</Text>
                  <Text><b>Contact Number:</b> {info?.mobile}</Text>
                </VStack>
              </Box>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onDetailClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </VStack>
  );
};

export default SupportCenter;
