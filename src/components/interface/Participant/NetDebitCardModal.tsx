import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Box,
    Text,
    Input,
    Button,
    Select
} from "@chakra-ui/react";

interface NetDebitCapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number) => void;
}

// Constants
const netDebitCardList = [{
    label: 'Fixed',
    value: 'fixed',
},
{ label: 'Percentage', value: 'percentage' },
]

const NetDebitCapModal = ({ isOpen, onClose }: NetDebitCapModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="center">Net Debit Cap</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <Select
                            mb={4}
                            name="currency"
                            placeholder="Choose Fixed/Percentage"
                            isRequired
                        >
                            {netDebitCardList.map((item, index) => (
                                <option key={index} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </Select>

                        <Box mb={4}>
                            <Text mb={2}>Fixed</Text>
                            <Input placeholder="Enter Amount..." type="number" min={0} />
                        </Box>

                        <Box mb={4}>
                            <Text mb={2}>Percentage</Text>
                            <Input placeholder="Enter Percentage..." type="number" min={0} />
                        </Box>
                    </Box>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} mr={3}>
                        Cancel
                    </Button>
                    <Button colorScheme="blue" type="submit">
                        Submit
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default NetDebitCapModal;
