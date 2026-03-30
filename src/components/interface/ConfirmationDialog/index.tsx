import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message?: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const ConfirmDialog = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    isLoading = false
}: ConfirmDialogProps) => {
    const { t } = useTranslation();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const resolvedTitle = title ?? t('ui.confirm');
    const resolvedMessage = message ?? t('ui.are_you_sure');
    const resolvedConfirmText = confirmText ?? t('ui.confirm');
    const resolvedCancelText = cancelText ?? t('ui.cancel');

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onCancel}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {resolvedTitle}
                    </AlertDialogHeader>

                    <AlertDialogBody>{resolvedMessage}</AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onCancel}>
                            {resolvedCancelText}
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={onConfirm}
                            ml={3}
                            isLoading={isLoading}
                        >
                            {resolvedConfirmText}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default ConfirmDialog;
