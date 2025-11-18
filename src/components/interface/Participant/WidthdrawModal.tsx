import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react";
import { useEffect } from "react";
import { validateAmount } from "@helpers/validation";
import { numericInputRegex } from "@helpers";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => void;
}

const WidthdrawMoal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [amount, setAmount] = useState<string>("");
    const { isValid, errorMessage } = validateAmount(amount, "Amount");
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
                <ModalHeader textAlign="center">Widthdraw Funds</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <FormControl isInvalid={isTouched && !!errorMessage} isRequired>
                            <FormLabel>Amount</FormLabel>
                            <Input
                                placeholder="Enter Amount..."
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
                    <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
                    <Button colorScheme="blue" isDisabled={!isValid} onClick={handleSubmit}>
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WidthdrawMoal;