import { useState } from "react";
import {
    Modal, ModalOverlay, ModalContent, ModalHeader,
    ModalCloseButton, ModalBody, ModalFooter,
    Button, Box, Text, Input
} from "@chakra-ui/react";

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [amount, setAmount] = useState<number>(0);

    const handleSubmit = () => {
        onSubmit(amount);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center">Withdraw Funds</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>

                        <Text mb={2}>Enter Amount...</Text>
                        <Input
                            placeholder="Enter Amount..."
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                        />
                    </Box>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
                    <Button colorScheme="blue" onClick={handleSubmit}>Submit</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default WithdrawModal;
