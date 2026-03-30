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
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();

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
                    title: t('ui.success'),
                    position: 'top',
                    description: isEdit ? t('ui.liquidity_profile_updated_successfully') : t('ui.liquidity_profile_created_successfully'),
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
                    description: getErrorMessage(err) || t('ui.failed_to_save_liquidity_profile'),
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, [form, isEdit, onClose, refetch, t, toast]);

    const confirmDelete = useCallback(() => {
        if (!deleteItem?.liquidityProfileId) return;

        removeLiquidityProfile({
            liquidityProfileId: deleteItem.liquidityProfileId,
            participantId: participantId
        })
            .then(() => {
                toast({
                    title: t('ui.success'),
                    position: 'top',
                    description: t('ui.liquidity_profile_deleted_successfully'),
                    status: 'success',
                    isClosable: true,
                    duration: 3000
                });
                refetch();
            })
            .catch((err: IApiErrorResponse) => {
                toast({
                    position: 'top',
                    description: getErrorMessage(err) || t('ui.failed_to_delete_liquidity_profile'),
                    status: 'error',
                    isClosable: true,
                    duration: 3000
                });
            })
            .finally(() => {
                onConfirmClose();
                setDeleteItem(null);
            });
    }, [deleteItem, onConfirmClose, refetch, t, toast, user]);

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
                    {t('ui.liquidity_profile')}
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
                        {t('ui.add')}
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
                            <HeaderCell borderColor={borderColor}>{t('ui.bank_name')}</HeaderCell>
                            <HeaderCell borderColor={borderColor}>{t('ui.account_name')}</HeaderCell>
                            <HeaderCell borderColor={borderColor}>{t('ui.account_number')}</HeaderCell>
                            <HeaderCell borderColor={borderColor}>{t('ui.currency')}</HeaderCell>
                            {(hasActionPermission("ModifyLiquidityProfile") || hasActionPermission("RemoveLiquidityProfile")) && (
                                <HeaderCell borderColor={borderColor}>
                                    {t('ui.action')}
                                </HeaderCell>
                            )}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data?.length === 0 && !isLoading && (
                            <Tr>
                                <Cell colSpan={(hasActionPermission("ModifyLiquidityProfile") || hasActionPermission("RemoveLiquidityProfile")) ? 5 : 4}>{t('ui.no_liquidity_found')}</Cell>
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
                                                <Tooltip label={t('ui.edit_liquidity_profile')} bg='white' color='black'>
                                                    <IconButton
                                                        icon={<FiEdit2 />}
                                                        aria-label={t('ui.edit')}
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                    />
                                                </Tooltip>
                                            )}

                                            {hasActionPermission("RemoveLiquidityProfile") && (
                                                <Tooltip label={t('ui.delete_liquidity_profile')} bg='white' color='black'>
                                                    <IconButton
                                                        icon={<FiTrash2 />}
                                                        aria-label={t('ui.delete')}
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
                            {t('ui.delete_liquidity_profile')}
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            {t('ui.are_you_sure_you_want_to_delete_this_liquidity_profile')}
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onConfirmClose}>
                                {t('ui.cancel')}
                            </Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                                {t('ui.delete')}
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
