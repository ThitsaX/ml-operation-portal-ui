import {
    Button,
    HStack,
    IconButton,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    VStack,
    Text,
    useColorModeValue,
    useDisclosure,
    useToast,
    Tooltip,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useGetLiquidityProfileList } from '@hooks/services/participant';
import LiquidityProfileModal from './LiquidityProfileModal';
import { useState, useCallback, useEffect } from 'react';
import { ILiquidityProfile } from '@typescript/services/participant';
import { createLiquidityProfile, modifyLiquidityProfile, removeLiquidityProfile } from '@services/participant';
import { useGetUserState } from '@store/hooks';
import { useRef } from 'react';


const defaultForm: ILiquidityProfile = {
    participantId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: '',

};

const LiquidityProfile = () => {
    const borderColor = useColorModeValue('gray', 'gray.600');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isEdit, setIsEdit] = useState(false);
    const headerBg = useColorModeValue('gray.200', 'gray.500');
    const { data: user } = useGetUserState();

    type FormState = ILiquidityProfile;


    const [form, setForm] = useState<FormState>(defaultForm);

    const {
        isOpen: isConfirmOpen,
        onOpen: onConfirmOpen,
        onClose: onConfirmClose
    } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [deleteItem, setDeleteItem] = useState<ILiquidityProfile | null>(null);




    const toast = useToast();

    const { data, isLoading, isError, error, refetch } = useGetLiquidityProfileList();

    useEffect(() => {
        if (user && user.participantId) {
            setForm((prev) => ({ ...prev, participantId: user?.participantId }));
        }
    }, [user]);

    const handleSave = useCallback((values: ILiquidityProfile) => {
        const action = isEdit
            ? modifyLiquidityProfile(values)
            : createLiquidityProfile(values);

        action
            .then(() => {
                toast({
                    position: 'top',
                    description: isEdit ? 'Liquidity Profile updated successfully' : 'Liquidity Profile created successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setForm({
                    ...defaultForm,
                    participantId: user?.participantId || ''
                });
                setIsEdit(false); // reset edit mode
                refetch();
                onClose();

            })
            .catch((err) => {
                toast({
                    position: 'top',
                    description: err.error_code || 'Something went wrong',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            });
    }, [form, isEdit, toast, onClose, refetch]);

    const confirmDelete = useCallback(() => {
        if (!deleteItem?.liquidityProfileId) return;
        const participantId = user?.participantId || "";

        removeLiquidityProfile({
            liquidityProfileId: deleteItem.liquidityProfileId,
            participantId
        })
            .then(() => {
                toast({
                    position: 'top',
                    description: 'Liquidity Profile deleted successfully',
                    status: 'success',
                    isClosable: true,
                    duration: 3000
                });
                refetch();
            })
            .catch(err => {
                toast({
                    position: 'top',
                    description: err.message || 'Something went wrong',
                    status: 'error',
                    isClosable: true,
                    duration: 3000
                });
            })
            .finally(() => {
                onConfirmClose();
                setDeleteItem(null);
            });
    }, [deleteItem, toast, refetch, onConfirmClose, user]);

    const handleDeleteClick = (item: ILiquidityProfile) => {
        setDeleteItem(item);
        onConfirmOpen();
    };


    const handleDelete = useCallback((item: any) => {

        const { liquidityProfileId } = item;
        const participantId = user?.participantId || "";
        removeLiquidityProfile({ liquidityProfileId, participantId })
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
            .catch((err) => {
                toast({
                    position: 'top',
                    description: err.message || 'Something went wrong',
                    status: 'error',
                    isClosable: true,
                    duration: 3000
                });
            });
    }, [toast, refetch]);

    const handleEdit = useCallback((item: ILiquidityProfile) => {
        setForm({
            liquidityProfileId: item.liquidityProfileId,
            bankName: item.bankName,
            accountName: item.accountName,
            accountNumber: item.accountNumber,
            currency: item.currency,
            participantId: user?.participantId || "",
        });

        setIsEdit(true);
        onOpen();
    }, [onOpen]);


    return (
        <VStack align="flex-start" spacing={4} w="full">
            <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="bold">
                    Liquidity Profile
                </Text>
                <Button colorScheme="blue" size="md" onClick={() => {
                    setForm({
                        ...defaultForm,
                        participantId: user?.participantId || ''
                    });
                    setIsEdit(false);
                    onOpen()
                }}>
                    Add
                </Button>
                <LiquidityProfileModal
                    isOpen={isOpen}
                    onClose={onClose}
                    onSave={handleSave}
                    form={form}
                    setForm={setForm}
                    isEdit={isEdit} // or "edit"
                />
            </HStack>

            <TableContainer border={`1px solid ${borderColor}`} borderRadius="sm" w="full">
                <Table variant="unstyled">
                    <Thead bg={headerBg}>
                        <Tr>
                            <Th textAlign="center" border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold"                            >
                                Bank Name
                            </Th>
                            <Th textAlign="center" border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold">
                                Account Name
                            </Th>
                            <Th textAlign="center" border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold">
                                Account Number
                            </Th>
                            <Th textAlign="center" border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold">
                                Currency
                            </Th>
                            <Th textAlign="center" border={`1px solid ${borderColor}`} px={4} py={3} fontSize="sm" fontWeight="semibold"                         >
                                Action
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data?.map((item, idx) => (
                            <Tr key={idx}>
                                <Td border={`1px solid ${borderColor}`} px={4} py={2} textAlign="center">
                                    {item.bankName}
                                </Td>
                                <Td border={`1px solid ${borderColor}`} px={4} py={2} textAlign="center">
                                    {item.accountName}
                                </Td>
                                <Td border={`1px solid ${borderColor}`} px={4} py={2} textAlign="center">
                                    {item.accountNumber}
                                </Td>
                                <Td border={`1px solid ${borderColor}`} px={4} py={2} textAlign="center">
                                    {item.currency}
                                </Td>
                                <Td border={`1px solid ${borderColor}`} px={4} py={2}>
                                    <HStack spacing={3} justify="center">
                                        <Tooltip label='Edit Liquidity Profile' bg='white' color='black'>
                                            <IconButton
                                                icon={<FiEdit2 />}
                                                aria-label="Edit"
                                                variant="ghost"
                                                size="md"
                                                onClick={() => handleEdit(item)}
                                            />
                                        </Tooltip>

                                        <Tooltip label='Delete Liquidity Profile' bg='white' color='black'>
                                            <IconButton
                                                icon={<FiTrash2 />}
                                                aria-label="Delete"
                                                variant="ghost"
                                                size="md"
                                                onClick={() =>
                                                    handleDeleteClick(item)
                                                }
                                            />
                                        </Tooltip>
                                    </HStack>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            <AlertDialog
                isOpen={isConfirmOpen}
                leastDestructiveRef={cancelRef}
                onClose={onConfirmClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Liquidity Profile
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to delete this liquidity profile? This action cannot be undone.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onConfirmClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </VStack>
    );
};

export default LiquidityProfile;
