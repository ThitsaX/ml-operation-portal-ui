import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Box,
    Input,
    Button,
    FormControl,
    FormLabel,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import CustomSelect from "../CustomSelect";

interface NetDebitCapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: "fixed" | "percentage", value: number) => Promise<void> | void;
}

const netDebitCardList = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Percentage', value: 'percentage' },
];

const NetDebitCapModal = ({ isOpen, onClose, onSubmit }: NetDebitCapModalProps) => {
    const [selectedType, setSelectedType] = useState<"fixed" | "percentage" | "">("");
    const [fixedAmount, setFixedAmount] = useState<string>("");
    const [percentage, setPercentage] = useState<string>("");

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedType === "fixed" && fixedAmount) {
            await onSubmit("fixed", Number(fixedAmount));
        } else if (selectedType === "percentage" && percentage) {
            await onSubmit("percentage", Number(percentage));
        }
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            setFixedAmount("");
            setPercentage("");
            setSelectedType("");
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
                <form onSubmit={handleFormSubmit}>
                    <ModalHeader textAlign="center">Net Debit Cap</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box mb={4}>
                            <FormControl mb={4} isRequired>
                                <FormLabel>Type</FormLabel>
                                <CustomSelect
                                    placeholder="Choose Fixed/Percentage"
                                    options={netDebitCardList.map(item => ({ value: item.value, label: item.label }))}
                                    value={netDebitCardList
                                        .map(item => ({ value: item.value, label: item.label }))
                                        .find(opt => opt.value === selectedType) || null}
                                    onChange={(selectedOption) => {
                                        setSelectedType(selectedOption?.value as "fixed" | "percentage" || "");
                                    }}
                                />
                            </FormControl>

                            {selectedType === "fixed" && (
                                <FormControl mb={4} isRequired>
                                    <FormLabel>Fixed</FormLabel>
                                    <Input
                                        placeholder="Enter Amount..."
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        name="fixedAmount"
                                        value={fixedAmount}
                                        onChange={(e) => setFixedAmount(e.target.value)}
                                    />
                                </FormControl>
                            )}

                            {selectedType === "percentage" && (
                                <FormControl mb={4} isRequired>
                                    <FormLabel>Percentage</FormLabel>
                                    <Input
                                        placeholder="Enter Percentage..."
                                        type="number"
                                        min={0}
                                        name="percentage"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                    />
                                </FormControl>
                            )}
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
                </form>
            </ModalContent>
        </Modal>
    );
};

export default NetDebitCapModal;