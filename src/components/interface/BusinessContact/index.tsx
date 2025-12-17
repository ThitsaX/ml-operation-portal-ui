import {
    Box,
    Button,
    HStack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Thead,
    Tr,
    VStack,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import { useState, useCallback, useEffect } from 'react';
import { IBusinessContact, BusinessContactType } from '@typescript/services';
import { useGetContactList } from '@hooks/services/participant';
import { createBusinessContact, modifyContact } from '@services/participant';
import BusinessContactModal from './BusinessContactModal';
import { useGetUserState } from '@store/hooks';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { removeContact } from '@services/participant';
import { HeaderCell, Cell } from '../Table';
import { ConfirmDialog } from '../ConfirmationDialog';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';

interface BusinessContactProps {
    participantId: string;
}

const BusinessContact: React.FC<BusinessContactProps> = ({ participantId }) => {
    const defaultForm: IBusinessContact = {
        participantId: participantId,
        name: '',
        position: '',
        email: '',
        mobile: '',
        contactType: BusinessContactType.TECHNICAL
    };

    const borderColor = useColorModeValue('gray', 'gray.600');
    const headerBg = useColorModeValue('gray.200', 'gray.500');

    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState<IBusinessContact>(defaultForm);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<IBusinessContact | null>(null);
    const { data, isLoading, refetch } = useGetContactList(participantId);
    const [isSaving, setIsSaving] = useState(false);

    const toast = useToast();
    const { data: user } = useGetUserState();
    const { isOpen, onOpen, onClose } = useDisclosure();

    useEffect(() => {
        if (participantId) {
            setForm((prev) => ({ ...prev, participantId: participantId }));
        }
    }, [user]);

    /* Handlers */
    const handleSave = useCallback((values: IBusinessContact) => {
        setIsSaving(true);
        const action = isEdit
            ? modifyContact(values)
            : createBusinessContact(values);

        action
            .then(() => {
                toast({
                    title: 'Success',
                    position: 'top',
                    description: isEdit ? 'Contact updated successfully' : 'Contact created successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setForm({
                    ...defaultForm,
                    participantId: participantId
                });
                setIsEdit(false);
                onClose();
                refetch();
            })
            .catch((err: IApiErrorResponse) => {
                toast({
                    position: 'top',
                    description: getErrorMessage(err) || 'Failed to save contact',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, [form, isEdit, toast, onClose, refetch]);

    const handleEdit = useCallback((item: IBusinessContact) => {
        setForm({
            name: item.name,
            position: item.position,
            email: item.email,
            mobile: item.mobile,
            contactType: item.contactType,
            contactId: item.contactId,
            participantId: participantId
        });
        setIsEdit(true);
        onOpen();
    }, [onOpen]);

    const handleDeleteClick = (item: IBusinessContact) => {
        setContactToDelete(item);
        setIsConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (!contactToDelete?.contactId) return;

        removeContact({
            contactId: contactToDelete.contactId,
            participantId: participantId
        })
            .then(() => {
                toast({
                    position: 'top',
                    description: 'User deleted successfully',
                    status: 'success',
                    isClosable: true,
                    duration: 3000
                });
                refetch();
            })
            .catch((err: IApiErrorResponse) => {
                toast({
                    position: 'top',
                    description: getErrorMessage(err) || 'Failed to delete contact',
                    status: 'error',
                    isClosable: true,
                    duration: 3000
                });
            })
            .finally(() => {
                setIsConfirmOpen(false);
                setContactToDelete(null);
            });
    };

    return (
        <Box
            width="100%"
            p={4}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            mb={6}
        >
        <VStack align="flex-start" spacing={4} w="full">
            <HStack justify="space-between" align="center" w="full">
                <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                    Contacts
                </Text>
                {hasActionPermission("CreateContact") && (
                    <Button colorScheme="blue" size="md" onClick={() => {
                        setForm({
                            ...defaultForm,
                            participantId: participantId
                        });
                        setIsEdit(false);
                        onOpen();
                    }}>
                        Add
                    </Button>
                )}
            </HStack>

            <BusinessContactModal
                isOpen={isOpen}
                onClose={onClose}
                onSave={handleSave}
                form={form}
                setForm={setForm}
                isEdit={isEdit}
                isSaving={isSaving}
            />

            <TableContainer border={`1px solid ${borderColor}`} borderRadius="sm" w="full">
                <Table variant="unstyled">
                    <Thead bg={headerBg}>
                        <Tr>
                            <HeaderCell borderColor={borderColor}> Contact Type</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Person Name</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Position</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Email</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Contact Number</HeaderCell>
                            {(hasActionPermission("ModifyContact") || hasActionPermission("RemoveContact")) && (
                                <HeaderCell borderColor={borderColor}>
                                      Action
                                </HeaderCell>
                            )}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data?.length === 0 && !isLoading && (
                            <Tr>
                                <Cell colSpan={6}>No contacts found</Cell>
                            </Tr>
                        )}
                        {data?.map((item) => (
                            <Tr key={item.contactId}>
                                <Cell borderColor={borderColor}>{item.contactType}</Cell>

                                <Cell borderColor={borderColor}>{item.name}</Cell>

                                <Cell borderColor={borderColor}>{item.position}</Cell>

                                <Cell borderColor={borderColor}>{item.email}</Cell>

                                <Cell borderColor={borderColor}>{item.mobile}</Cell>
                                {( hasActionPermission("ModifyContact") || hasActionPermission("RemoveContact")) && (

                                <Td border={`1px solid ${borderColor}`} px={4} py={2}>
                                    <HStack spacing={3} justify="center">
                                        {hasActionPermission("ModifyContact") && (
                                            <Tooltip label='Edit Contact' bg='white' color='black'>
                                                <IconButton
                                                    icon={<FiEdit2 />}
                                                    aria-label="Edit"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(item)}
                                                />
                                            </Tooltip>
                                        )}

                                        {hasActionPermission("RemoveContact") && (
                                            <Tooltip label='Delete Contact' bg='white' color='black'>
                                                <IconButton
                                                    icon={<FiTrash2 />}
                                                    aria-label="Delete"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(item)}
                                                />
                                            </Tooltip>
                                        )}
                                    </HStack>
                                </Td>
                                )}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Contact"
                message="Are you sure you want to delete this contact?"
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)} />

        </VStack>
        </Box>
    );
};

export default BusinessContact;
