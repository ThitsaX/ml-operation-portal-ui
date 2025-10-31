import {
    Box,
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
import { Cell, HeaderCell } from '../Table';
import { type IApiErrorResponse } from '@typescript/services';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';

const defaultForm: ILiquidityProfile = {
    participantId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: '',

};
interface LiquidityProfileProps {
    participantId: string;
}

const LiquidityProfile: React.FC<LiquidityProfileProps> = ({ participantId }) => {

    const borderColor = useColorModeValue('gray', 'gray.600');
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isEdit, setIsEdit] = useState(false);
    const headerBg = useColorModeValue('gray.200', 'gray.500');
    const { data: user } = useGetUserState();

    type FormState = ILiquidityProfile;

    const [form, setForm] = useState<FormState>(defaultForm);

    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [deleteItem, setDeleteItem] = useState<ILiquidityProfile | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const toast = useToast();

    const { data, isLoading, isError, error, refetch } = useGetLiquidityProfileList(participantId || "");

    useEffect(() => {
        if (participantId) {
            setForm((prev) => ({ ...prev, participantId: participantId }));
        }
    }, [user]);

    const handleSave = useCallback((values: ILiquidityProfile) => {
        setIsSaving(true); 
        const action = isEdit
            ? modifyLiquidityProfile(values)
            : createLiquidityProfile(values);

        action
            .then(() => {
                toast({
                    title: 'Success',
                    position: 'top',
                    description: isEdit ? 'Liquidity Profile updated successfully' : 'Liquidity Profile created successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                setForm({
                    ...defaultForm,
                    participantId: participantId
                });
                setIsEdit(false); // reset edit mode
                refetch();
                onClose();

            })
            .catch((err: IApiErrorResponse) => {
                toast({
                    position: 'top',
                    description: getErrorMessage(err) || 'Failed to save liquidity profile',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, [form, isEdit, toast, onClose, refetch]);

    const confirmDelete = useCallback(() => {
        if (!deleteItem?.liquidityProfileId) return;

        removeLiquidityProfile({
            liquidityProfileId: deleteItem.liquidityProfileId,
            participantId: participantId
        })
            .then(() => {
                toast({
                    title: 'Success',
                    position: 'top',
                    description: 'Liquidity Profile deleted successfully',
                    status: 'success',
                    isClosable: true,
                    duration: 3000
                });
                refetch();
            })
            .catch((err: IApiErrorResponse) => {
                toast({
                    position: 'top',
                    description: getErrorMessage(err) || 'Failed to delete liquidity profile',
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

    const handleEdit = useCallback((item: ILiquidityProfile) => {
        setForm({
            liquidityProfileId: item.liquidityProfileId,
            bankName: item.bankName,
            accountName: item.accountName,
            accountNumber: item.accountNumber,
            currency: item.currency,
            participantId: participantId,
        });

        setIsEdit(true);
        onOpen();
    }, [onOpen]);


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
                    Liquidity Profile
                </Text>
                {hasActionPermission("CreateLiquidityProfile") && (
                    <Button colorScheme="blue" size="md" onClick={() => {
                        setForm({
                            ...defaultForm,
                            participantId: participantId
                        });
                        setIsEdit(false);
                        onOpen()
                    }}>
                        Add
                    </Button>
                )}
            </HStack>

            <LiquidityProfileModal
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
                            <HeaderCell borderColor={borderColor}>Bank Name</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Account Name</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Account Number</HeaderCell>
                            <HeaderCell borderColor={borderColor}>Currency</HeaderCell>
                            {(hasActionPermission("ModifyLiquidityProfile") || hasActionPermission("RemoveLiquidityProfile")) && (
                                <HeaderCell borderColor={borderColor}>
                                    Action
                                </HeaderCell>
                            )}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data?.length === 0 && !isLoading && (
                            <Tr>
                                <Cell colSpan={(hasActionPermission("ModifyLiquidityProfile") || hasActionPermission("RemoveLiquidityProfile")) ? 5 : 4}>No Liquidity found</Cell>
                            </Tr>
                        )}
                        {data?.map((item, idx) => (
                            <Tr key={idx}>
                                <Cell borderColor={borderColor}>{item.bankName}</Cell>
                                
                                <Cell borderColor={borderColor}>{item.accountName}</Cell>
                                
                                <Cell borderColor={borderColor}>{item.accountNumber}</Cell>
                                
                                <Cell borderColor={borderColor}>{item.currency}</Cell>

                                {( hasActionPermission("ModifyLiquidityProfile") || hasActionPermission("RemoveLiquidityProfile")) && (
                                    <Td border={`1px solid ${borderColor}`} px={4} py={2}>
                                        <HStack spacing={3} justify="center">
                                            {hasActionPermission("ModifyLiquidityProfile") && (
                                                <Tooltip label='Edit Liquidity Profile' bg='white' color='black'>
                                                    <IconButton
                                                        icon={<FiEdit2 />}
                                                        aria-label="Edit"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                    />
                                                </Tooltip>
                                            )}

                                            {hasActionPermission("RemoveLiquidityProfile") && (
                                                <Tooltip label='Delete Liquidity Profile' bg='white' color='black'>
                                                    <IconButton
                                                        icon={<FiTrash2 />}
                                                        aria-label="Delete"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteClick(item)
                                                        }
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
        </Box>
    );
};

export default LiquidityProfile;
