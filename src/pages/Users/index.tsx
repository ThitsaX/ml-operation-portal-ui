import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Heading,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  Tooltip
} from '@chakra-ui/react';
import { useLoadingContext } from '@contexts/hooks';
import { getRequestErrorMessage } from '@helpers/errors';
import { useGetAllParticipants } from '@hooks/services';
import { removeParticipantUser } from '@services/participant';
import { useGetUserState } from '@store/hooks';
import {
  type IApiErrorResponse,
  type IParticipantUser
} from '@typescript/services';
import { capitalize } from 'lodash-es';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { IoPencilOutline, IoReload, IoTrashOutline } from 'react-icons/io5';

const EditUser = lazy(() => import('./EditUser'));
const ResetPassword = lazy(() => import('./ResetPassword'));

const Users = () => {
  const { start, complete } = useLoadingContext();

  const toast = useToast();
  /* Redux */
  const { data: user } = useGetUserState();
  /* React Query */
  const { data, refetch } = useGetAllParticipants();

  /* Disclosure */
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenEdit,
    onOpen: onOpenEdit,
    onClose: onCloseEdit
  } = useDisclosure();
  const {
    isOpen: isOpenResetPassword,
    onOpen: onOpenResetPassword,
    onClose: onCloseResetPassword
  } = useDisclosure();

  /* Ref */
  const cancelRef = useRef(null);

  /* State */
  const [currentUser, setCurrentUser] = useState<IParticipantUser>();

  /* Handlers */
  const onClickReset = useCallback(
    (data: IParticipantUser) => {
      setCurrentUser(data);
      onOpenResetPassword();
    },
    [onOpenResetPassword]
  );
  const onClickEdit = useCallback(
    (data: IParticipantUser) => {
      setCurrentUser(data);
      onOpenEdit();
    },
    [onOpenEdit]
  );

  const onClickRemove = useCallback(
    (data: IParticipantUser) => {
      setCurrentUser(data);
      onOpen();
    },
    [onOpen]
  );

  const onSaveEdit = useCallback(() => {
    refetch();
    onCloseEdit();
  }, [onCloseEdit, refetch]);

  const onSaveResetPassword = useCallback(() => {
    refetch();
    onCloseResetPassword();
  }, [onCloseResetPassword, refetch]);

  const onDelete = useCallback(() => {
    start();
    removeParticipantUser({
      participant_user_id: currentUser?.participant_user_id as string,
      participant_id: user?.participantId as string
    })
      .then(() => {
        toast({
          position: 'top',
          description: 'user-deleted-successfully',
          status: 'success',
          isClosable: true,
          duration: 3000
        });
        refetch();
        onClose();
      })
      .catch((err: IApiErrorResponse) =>
        toast({
          position: 'top',
          description: getRequestErrorMessage(err),
          status: 'error',
          isClosable: true,
          duration: 3000
        })
      )
      .finally(() => {
        complete();
      });
  }, [
    complete,
    currentUser?.participant_user_id,
    onClose,
    refetch,
    start,
    toast,
    user?.participantId
  ]);

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4}>
      <Modal isOpen={isOpenEdit} onClose={onCloseEdit}>
        <ModalOverlay />
        <ModalContent py="4">
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isOpenEdit ? (
              <Suspense fallback={<Text>Loading</Text>}>
                <EditUser
                  data={currentUser as IParticipantUser}
                  onSave={onSaveEdit}
                />
              </Suspense>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isOpenResetPassword} onClose={onCloseResetPassword}>
        <ModalOverlay />
        <ModalContent py="4">
          <ModalHeader>Reset Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isOpenResetPassword ? (
              <Suspense fallback={<Text>Loading</Text>}>
                <ResetPassword
                  data={{ email: currentUser?.email || '' }}
                  onSave={onSaveResetPassword}
                  onCancel={onCloseResetPassword}
                />
              </Suspense>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent alignSelf="center">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove User
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                variant="ghost"
                onClick={onDelete}
                ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <Box>
        <Heading fontSize="3xl">Users</Heading>
      </Box>
      <TableContainer
        w="full"
        borderWidth={1}
        borderBottom={0}
        borderColor="gray.100"
        rounded="lg">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Role/Permission</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.map((data) => {
              return (
                <Tr key={data.email}>
                  <Td>{data.email}</Td>
                  <Td>{data.name}</Td>
                  <Td>{capitalize(data.userRoleType)}</Td>
                  <Td>
                    <HStack align="center" spacing="2">
                      <Tooltip label='Reset Password' bg='white' color='black'>
                        <IconButton
                          colorScheme="yellow"
                          variant="ghost"
                          aria-label="Reset Password"
                          icon={<IoReload />}
                          isDisabled={data.participant_user_id === user?.user_id}
                          onClick={() => {
                            onClickReset(data);
                          }}
                        />
                      </Tooltip>
                      <Tooltip label='Edit Account' bg='white' color='black'>
                        <IconButton
                          colorScheme="muted"
                          variant="ghost"
                          aria-label="Edit Account"
                          icon={<IoPencilOutline />}
                          onClick={() => {
                            onClickEdit(data);
                          }}
                        />
                      </Tooltip>
                      <Tooltip label='Remove Account' bg='white' color='black'>
                        <IconButton
                          colorScheme="red"
                          variant="ghost"
                          aria-label="Remove Account"
                          icon={<IoTrashOutline />}
                          isDisabled={data.participant_user_id === user?.user_id}
                          onClick={() => {
                            onClickRemove(data);
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
};

export { default as CreateUser } from './CreateUser';
export default Users;
