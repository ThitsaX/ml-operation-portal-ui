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
import { getContactList } from '@services/participant';
import { IBusinessContact, IParticipantOrganization } from '@typescript/services';
import { SupportCard } from '@components/interface/SupportCenter';
import { type IApiErrorResponse } from '@typescript/services';
import { getParticipantListIncludingHub } from '@services/participant';
import { Spinner } from '@chakra-ui/react';
import { getDisputeLink, getServiceRequestLink } from '@services/support-center';
import { Avatar } from '@chakra-ui/react';

const SupportCenter = () => {
  const toast = useToast();

  const [selectedParticipant, setSelectedParticipant] = useState<IParticipantOrganization>();
  const [contactList, setContactList] = useState<IBusinessContact[] | null>(null);
  const [participantInfoList, setParticipantInfoList] = useState<IParticipantOrganization[] | null>(null);

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const [isLoadingDispute, setIsLoadingDispute] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(false);

  // Modal Control
  const { isOpen: isListOpen, onOpen: onListOpen, onClose: onListClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();

  // Handlers
  const handleDisputeClick = async () => {
    setIsLoadingDispute(true);
    try {
      const url = await getDisputeLink();
      if (!url) {
        toast({
          position: "top",
          description: "This feature is currently unavailable.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      window.open(url, "_blank");
    } catch (err) {
      toast({
        position: "top",
        title: getErrorMessage(err as IApiErrorResponse),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoadingDispute(false);
    }
  };

  const handleServiceClick = async () => {
    setIsLoadingService(true);
    try {
      const url = await getServiceRequestLink();
      if (!url) {
        toast({
          position: "top",
          description: "This feature is currently unavailable.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      window.open(url, "_blank");
    } catch (err) {
      toast({
        position: "top",
        title: getErrorMessage(err as IApiErrorResponse),
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoadingService(false);
    }
  };

  const handleViewListClick = async () => {
    if (isLoadingList) return;
    setIsLoadingList(true);
    onListOpen();
    try {
      const data = await getParticipantListIncludingHub();

      if (!data?.length) {
        toast({
          position: "top",
          description: "No data found",
          status: "warning",
          isClosable: true,
          duration: 3000,
        });
        setParticipantInfoList([]);
        return;
      }
      setParticipantInfoList(data);

    } catch (error) {
      setParticipantInfoList([]);
      toast({
        position: "top",
        title: getErrorMessage(error as IApiErrorResponse),
        status: "error",
        isClosable: true,
        duration: 3000,
      })
    } finally {
      setIsLoadingList(false);
    }
  };

  const showParticipantContacts = async (participant: IParticipantOrganization) => {
    setSelectedParticipant(participant);
    setIsLoadingContacts(true);
    onDetailOpen();

    try {
      const data = await getContactList(participant.participantId);
      setContactList(data || []);
    } catch (err) {
      toast({
        position: 'top',
        description: getErrorMessage(err as IApiErrorResponse),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setContactList([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const groupedContacts = contactList?.reduce((acc, contact) => {
    if (!acc[contact.contactType]) {
      acc[contact.contactType] = [];
    }
    acc[contact.contactType].push(contact);
    return acc;
  }, {} as Record<string, IBusinessContact[]>);

  const wheelFallback = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight > target.clientHeight) {
      target.scrollTop += e.deltaY;
      // prevent page/body from also scrolling
      e.preventDefault();
    }
  };

  return (
    <VStack align="flex-start" w="full" h="full" p="3" mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>Support Center</Heading>

      <Flex w="full" wrap="wrap" justify="center" gap={6} pb={4}>
        <SupportCard
          icon={<TbGavel size={60} />}
          title="Dispute"
          description="Raise an issue or challenge"
          actionLabel={"Submit Dispute"}
          color="orange.700"
          onClick={handleDisputeClick}
          isLoading={isLoadingDispute}
          tooltipLabel="Fetching dispute link… Please wait."
        />

        <SupportCard
          icon={<GrServices size={60} />}
          title="Service Request"
          description="Request assistance or information"
          actionLabel={"Service Request"}
          color="blue.700"
          onClick={handleServiceClick}
          isLoading={isLoadingService}
          tooltipLabel="Fetching service request link… Please wait."
        />

        <SupportCard
          icon={<ImUsers size={60} />}
          title="Support Contacts"
          description="View focal contacts for support"
          actionLabel="View List"
          onClick={handleViewListClick}
          color="gray.600"
          isLoading={isLoadingList}
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
            {isLoadingList ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <VStack spacing={4} align="center">
                  <Spinner size="xl" color="blue.500" />
                  <Text color="gray.600">Loading dfsp list</Text>
                </VStack>
              </Box>
            ) : (


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
                    {p.logo ? (<Image
                      src={`data:${p.logoFileType};base64,${p.logo}`}
                      alt={p.participantName}
                      boxSize={{ base: "56px", md: "60px" }}
                      objectFit="cover"
                      borderRadius="full"
                      mx="auto"
                      mb={2}
                    />)
                      : (<Avatar name={p.participantName} size="lg"
                        mx="auto" mb={2}
                      />)}
                    <Text fontWeight="medium" fontSize="sm" noOfLines={2}>
                      {p.participantName ? p.participantDescription ?
                        `${p.participantName} (${p.participantDescription})`
                        : p.participantName : ''}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
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
          <ModalBody  onWheel={wheelFallback} textAlign="center" maxH="70vh" overflowY="auto">

            <Flex align="center" mb={6}>
              {selectedParticipant?.logo ? (<Image
                src={`data:${selectedParticipant?.logoFileType};base64,${selectedParticipant?.logo}`}
                alt={selectedParticipant?.participantName}
                boxSize="60px"
                objectFit="cover"
                borderRadius="full"
                mr={4}
              />) : (<Avatar name={selectedParticipant?.participantName} size="lg"
                mr={4}
              />)}
              <Text fontWeight="bold" fontSize="lg">
                {selectedParticipant?.participantName ? selectedParticipant.participantDescription ?
                  `${selectedParticipant.participantName} (${selectedParticipant.participantDescription})`
                  : selectedParticipant.participantName : 'Participant'}
              </Text>
            </Flex>

            {isLoadingContacts ? (
              <VStack spacing={4} py={10}>
                <Spinner size="xl" color="blue.500" />
                <Text color="gray.600">Loading contact list...</Text>
              </VStack>
            ) : (
              <>
                {groupedContacts &&
                  Object.entries(groupedContacts).map(([contactType, contacts]) => (
                    <Box key={contactType} mb={2} p={4}>
                      <Text fontWeight="bold" fontSize="lg" mb={4}>
                        {contactType}
                      </Text>

                      <>
                        {contacts.map((info) => (
                          <VStack key={info.contactId} spacing={2} align="start" mb={4}>
                            <Text><b>Contact Person Name:</b> {info.name}</Text>
                            <Text><b>Position:</b> {info.position}</Text>
                            <Text><b>Email:</b> {info.email}</Text>
                            <Text><b>Contact Number:</b> {info.mobile}</Text>
                          </VStack>
                        ))}
                      </>
                    </Box>
                  ))}
              </>
            )}
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
