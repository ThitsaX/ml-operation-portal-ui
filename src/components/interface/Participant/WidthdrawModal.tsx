import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react";
import { useEffect } from "react";
import { validateAmount } from "@helpers/validation";
import { numericInputRegex } from "@helpers";
import { useTranslation } from 'react-i18next';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => void;
}

const WidthdrawMoal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>("");
    const { isValid, errorMessage } = validateAmount(amount, t('ui.amount'));
    const [isTouched, setIsTouched] = useState(false);

    const handleSubmit = () => {
        if (!isValid) return;
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
                <ModalHeader textAlign="center">{t('ui.withdraw_funds')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <FormControl isInvalid={isTouched && !!errorMessage} isRequired>
                            <FormLabel>{t('ui.amount')}</FormLabel>
                            <Input
                                placeholder={t('ui.enter_amount')}
                                type="text"
                                min={1}
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
                    <Button colorScheme="blue" isDisabled={!isValid} onClick={handleSubmit}>
                        {t('ui.submit')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WidthdrawMoal;
