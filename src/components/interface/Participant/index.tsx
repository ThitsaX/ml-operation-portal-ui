import { useEffect, useRef, useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react";
import { validateAmount } from "@helpers/validation";
import { numericInputRegex } from "@helpers";
import { useTranslation } from 'react-i18next';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>("");
    const {isValid, errorMessage} = validateAmount(amount, t('ui.amount'));
    const [isTouched, setIsTouched] = useState(false);
    const submitLockedRef = useRef(false);

    const handleSubmit = () => {
        if (!isValid || submitLockedRef.current) return;
        submitLockedRef.current = true;
        onSubmit(amount);
        onClose();
    };

    const handleNumericInputChange = ( value: string) => {
            if (!isTouched) setIsTouched(true);
            if (value === "" || numericInputRegex.test(value)) {
                setAmount(value);
            }
    };

    useEffect(() => {
        if (isOpen) {
            setAmount("");
            setIsTouched(false);
            submitLockedRef.current = false;
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent
                w={{ base: "90%", md: "500px" }}  
                maxW="90%"                        
                mx="auto"                         
            >
                <ModalHeader textAlign="center">{t('ui.deposit_funds')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <FormControl isInvalid={isTouched && !!errorMessage} isRequired>
                            <FormLabel>{t('ui.amount')}</FormLabel>
                            <Input
                                placeholder={t('ui.enter_amount')}
                                type="text"
                                value={amount}
                                onChange={(e) =>
                                        handleNumericInputChange(e.target.value)
                                }
                            />
                            {isTouched && errorMessage && (
                                <FormErrorMessage>{errorMessage}</FormErrorMessage>
                            )}
                        </FormControl>
                    </Box>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} mr={3}>{t('ui.cancel')}</Button>
                    <Button
                        colorScheme="blue"
                        isDisabled={!isValid}
                        onClick={handleSubmit}
                    >
                        {t('ui.submit')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DepositModal;
