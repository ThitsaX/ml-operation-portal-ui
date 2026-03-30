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
import { numericInputRegex } from "@helpers";
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [selectedType, setSelectedType] = useState<"fixed" | "percentage" | "">("");
    const [fixedAmount, setFixedAmount] = useState<string>("");
    const [percentage, setPercentage] = useState<string>("");
    const [isTouched, setIsTouched] = useState(false);

    const inputValue = selectedType === "fixed" ? fixedAmount : percentage;
    const inputLabel = selectedType === "fixed" ? t('ui.amount') : t('ui.percentage');

    const { isValid, errorMessage } = validateAmount( inputValue, inputLabel, selectedType === "percentage" ? "100.00" : undefined);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedType === "fixed" && fixedAmount) {
            await onSubmit("fixed", fixedAmount);
        } else if (selectedType === "percentage" && percentage) {
            await onSubmit("percentage", percentage);
        }
        onClose();
    };

    const handleNumericInputChange = ( value: string, setter: (v: string) => void) => {
        if (!isTouched) setIsTouched(true);
        if (value === "" || numericInputRegex.test(value)) {
            setter(value);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setFixedAmount("");
            setPercentage("");
            setSelectedType("");
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
                <form onSubmit={handleFormSubmit}>
                    <ModalHeader textAlign="center">{t('ui.net_debit_cap')}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box mb={4}>
                            <FormControl mb={4} isRequired>
                                <FormLabel>{t('ui.type')}</FormLabel>
                                <CustomSelect
                                    placeholder={t('ui.choose_fixed_percentage')}
                                    options={netDebitCardList.map(item => ({ value: item.value, label: item.label }))}
                                    value={netDebitCardList
                                        .map(item => ({ value: item.value, label: item.label }))
                                        .find(opt => opt.value === selectedType) || null}
                                    onChange={(selectedOption) => {
                                        setSelectedType(selectedOption?.value as "fixed" | "percentage" || "");
                                        setIsTouched(false);
                                    }}
                                />
                            </FormControl>

                            {selectedType === "fixed" && (
                                <FormControl isInvalid={isTouched && !!errorMessage} mb={4} isRequired>
                                    <FormLabel>{t('ui.fixed')}</FormLabel>
                                    <Input
                                        placeholder={t('ui.enter_amount')}
                                        type="text"
                                        name="fixedAmount"
                                        value={fixedAmount}
                                        onChange={(e) => handleNumericInputChange(e.target.value, setFixedAmount)}
                                    />
                                    <FormErrorMessage>{errorMessage}</FormErrorMessage>
                                </FormControl>
                            )}

                            {selectedType === "percentage" && (
                                <FormControl isInvalid={isTouched && !!errorMessage} mb={4} isRequired>
                                    <FormLabel>{t('ui.percentage')}</FormLabel>
                                    <Input
                                        placeholder={t('ui.enter_percentage')}
                                        type="text"
                                        name="percentage"
                                        value={percentage}
                                        onChange={(e) => handleNumericInputChange(e.target.value, setPercentage)}
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
