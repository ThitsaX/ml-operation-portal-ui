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
    FormErrorMessage
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import CustomSelect from "../CustomSelect";
import { validateAmount } from "@helpers/validation";

interface NetDebitCapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: "fixed" | "percentage", value: string) => Promise<void> | void;
}

const netDebitCardList = [
    { label: 'Fixed', value: 'fixed' },
    { label: 'Percentage', value: 'percentage' },
];

const NetDebitCapModal = ({ isOpen, onClose, onSubmit }: NetDebitCapModalProps) => {
    const [selectedType, setSelectedType] = useState<"fixed" | "percentage" | "">("");
    const [fixedAmount, setFixedAmount] = useState<string>("");
    const [percentage, setPercentage] = useState<string>("");

    const inputValue = selectedType === "fixed" ? fixedAmount : percentage;
    const inputLabel = selectedType === "fixed" ? "Amount" : "Percentage";

    const { isValid, errorMessage } = validateAmount( inputValue, inputLabel);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedType === "fixed" && fixedAmount) {
            await onSubmit("fixed", fixedAmount);
        } else if (selectedType === "percentage" && percentage) {
            await onSubmit("percentage", percentage);
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
                                <FormControl isInvalid={!!errorMessage} mb={4} isRequired>
                                    <FormLabel>Fixed</FormLabel>
                                    <Input
                                        placeholder="Enter Amount..."
                                        type="number"
                                        name="fixedAmount"
                                        value={fixedAmount}
                                        onChange={(e) => setFixedAmount(e.target.value)}
                                    />
                                    <FormErrorMessage>{errorMessage}</FormErrorMessage>
                                </FormControl>
                            )}

                            {selectedType === "percentage" && (
                                <FormControl isInvalid={!!errorMessage} mb={4} isRequired>
                                    <FormLabel>Percentage</FormLabel>
                                    <Input
                                        placeholder="Enter Percentage..."
                                        type="number"
                                        name="percentage"
                                        value={percentage}
                                        onChange={(e) => setPercentage(e.target.value)}
                                    />
                                    <FormErrorMessage>{errorMessage}</FormErrorMessage>
                                </FormControl>
                            )}
                        </Box>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" onClick={onClose} mr={3}>
                            Cancel
                        </Button>
                        <Button colorScheme="blue" isDisabled={!isValid} type="submit">
                            Submit
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default NetDebitCapModal;