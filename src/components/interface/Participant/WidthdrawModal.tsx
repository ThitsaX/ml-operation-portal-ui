import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Input, FormControl, FormLabel, FormErrorMessage
} from "@chakra-ui/react";
import { useEffect } from "react";

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number) => void;
}

const WidthdrawMoal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [amount, setAmount] = useState<number>(0);
    const [error, setError] = useState<string>("");

    const handleSubmit = () => {
        if (amount <= 0) {
            setError("Amount must be greater than 0");
            return;
        }
        setError("");
        onSubmit(amount);
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setAmount(0);
            setError("");
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center">Widthdraw Funds</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <FormControl isInvalid={!!error} isRequired>
                            <FormLabel>Amount</FormLabel>
                            <Input
                                placeholder="Enter Amount..."
                                type="number"
                                min={1}
                                value={amount === 0 ? "" : amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAmount(val === "" ? 0 : Number(val));
                                }}
                            />
                            <FormErrorMessage>{error}</FormErrorMessage>
                        </FormControl>
                    </Box>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
                    <Button colorScheme="blue" onClick={handleSubmit}>
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WidthdrawMoal;