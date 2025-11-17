import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react";
import { useEffect } from "react";
import { validateAmount } from "@helpers/validation";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: string) => void;
}

const WidthdrawMoal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [amount, setAmount] = useState<string>("");
    const { isValid, errorMessage } = validateAmount(amount, "Amount");

    const handleSubmit = () => {
        if (!isValid) return;
        onSubmit(amount);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setAmount("");
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
                        <FormControl isInvalid={!!errorMessage} isRequired>
                            <FormLabel>Amount</FormLabel>
                            <Input
                                placeholder="Enter Amount..."
                                type="number"
                                min={1}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <FormErrorMessage>{errorMessage}</FormErrorMessage>
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