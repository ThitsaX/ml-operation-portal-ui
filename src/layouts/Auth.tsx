import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure
} from '@chakra-ui/react'
import { AnnouncementCard, Carousel } from '@components/interface'
import { useGetAllAnnouncement } from '@hooks/services'
import { useGetUserState } from '@store/hooks'
import { type AnnouncementInfo } from '@typescript/services'
import { isEmpty } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

const Auth = () => {
  const navigate = useNavigate()

  /* Disclosure */
  const { isOpen, onOpen, onClose } = useDisclosure()

  /* Redux */
  const user = useGetUserState()

  /* React Query */
  const { data } = useGetAllAnnouncement()

  /* State */
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<AnnouncementInfo>()

  /* Handlers */
  const onClickAnnouncementCard = useCallback(
    (item: AnnouncementInfo) => {
      setCurrentAnnouncement(item)
      onOpen()
    },
    [onOpen]
  )

  useEffect(() => {
    if (user.auth != null) {
      navigate('/dashboard', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{currentAnnouncement?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH={375} overflowY="scroll">
            {currentAnnouncement?.detail}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" variant="ghost" onClick={onClose}>
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Outlet />
      {!isEmpty(data) ? (
        <Box py="2.5" px="5" zIndex={1}>
          <HStack align="center" justify="space-between" mb="2">
            <Heading fontSize="3xl">Announcements</Heading>
            <Flex
              w={10}
              h={6}
              bg="red.400"
              rounded="full"
              alignItems="center"
              justifyContent="center">
              <Text fontSize="sm" color="white" textAlign="center">
                {(data?.length || 0) > 99 ? '99+' : data?.length}
              </Text>
            </Flex>
          </HStack>

          <Carousel
            data={data?.map((announcement) => {
              return (
                <AnnouncementCard
                  key={announcement.id}
                  {...announcement}
                  onClick={onClickAnnouncementCard}
                />
              )
            })}
          />
        </Box>
      ) : null}
    </>
  )
}

export default Auth
