import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    VStack,
    Input,
    Select,
    Button,
    Box,
    SimpleGrid,
    Checkbox,
    Text,
    Switch,
    Divider,
    Flex
} from '@chakra-ui/react';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose }) => {
    const [timeZones, setTimeZones] = useState(['']);
    const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tues', 'Wed', 'Thurs', 'Fri']);
    const days = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

    const handleTimeChange = (index: number, value: string) => {
        const updated = [...timeZones];
        updated[index] = value;
        setTimeZones(updated);
    };

    const addTimeField = () => {
        setTimeZones([...timeZones, '']);
    };

    const removeTimeField = (index: number) => {
        const updated = timeZones.filter((_, i) => i !== index);
        setTimeZones(updated);
    };

    const toggleDay = (day: string) => {
        setSelectedDays((prev) =>
            prev.includes(day)
                ? prev.filter((d) => d !== day)
                : [...prev, day]
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader textAlign="left" fontSize="xl" fontWeight="bold" textDecoration="underline">
                    Settlement Models
                </ModalHeader>
                <ModalCloseButton />

                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <Flex align="center">
                            <Text w="220px" fontWeight="semibold">Settlement Model Name:</Text>
                            <Input placeholder="DEFAULT_DEFERRED_NET" isDisabled flex="1" maxW="60%" />
                        </Flex>

                        <Flex align="center">
                            <Text w="220px" fontWeight="semibold">Settlement Model Type:</Text>
                            <Input placeholder="MULTILATERAL_DEFERRED_NET" isDisabled flex="1" maxW="60%" />
                        </Flex>

                        <Flex align="center">
                            <Text w="220px" fontWeight="semibold">Settlement Model Currency:</Text>
                            <Input placeholder="LRD" isDisabled flex="1" maxW="60%" />
                        </Flex>

                        <Flex justify="space-between" align="center">
                            <Text fontWeight="semibold">Allow Closing Window Manually</Text>
                            <Switch defaultChecked colorScheme="green" />
                        </Flex>

                        <Flex justify="space-between" align="center">
                            <Text fontWeight="semibold">Closed Window Automatically</Text>
                            <Switch defaultChecked colorScheme="green" />
                        </Flex>

                        <Box border="1px" borderColor="gray.300" borderRadius="md" p={4}>
                            <VStack align="stretch" spacing={3}>
                                <Flex align="center">
                                    <Text w="220px" fontSize="sm" fontWeight="semibold">Choose Time Zone*:</Text>
                                    <Select placeholder="Select time zone" flex="1" maxW="50%">
                                        <option value="MMT">MMT</option>
                                        <option value="UTC">UTC</option>
                                    </Select>
                                    <Text fontSize="xs" color="gray.500" ml={2}>eg. MMT</Text>
                                </Flex>

                                {timeZones.map((time, index) => (
                                    <Flex key={index} align="center">
                                        <Text w="220px" fontSize="sm" fontWeight="semibold">Window Close Time*:</Text>
                                        <Input
                                            placeholder="hh:mm:ss"
                                            value={time}
                                            onChange={(e) => handleTimeChange(index, e.target.value)}
                                            flex="1"
                                            maxW="50%"
                                        />
                                        <Button variant="ghost" colorScheme="red" size="sm" ml={2} onClick={() => removeTimeField(index)}>
                                            X
                                        </Button>
                                        {index === 0 && <Text fontSize="xs" color="gray.500" ml={2}>eg. 10:00:00 AM</Text>}
                                        {index === 1 && <Text fontSize="xs" color="gray.500" ml={2}>eg. 02:00:00 PM</Text>}
                                    </Flex>
                                ))}

                                <Button size="sm" colorScheme="blue" onClick={addTimeField} alignSelf="flex-start">
                                    Add another time
                                </Button>

                                <Divider />

                                <SimpleGrid columns={7} spacing={1}>
                                    {days.map((day) => (
                                        <Checkbox
                                            key={day}
                                            isChecked={selectedDays.includes(day)}
                                            onChange={() => toggleDay(day)}
                                            size="lg"
                                        >
                                            {day}
                                        </Checkbox>
                                    ))}
                                </SimpleGrid>
                            </VStack>
                        </Box>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="blue">Save</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SettlementModal;
