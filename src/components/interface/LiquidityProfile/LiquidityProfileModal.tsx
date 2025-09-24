import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Input,
    VStack,
    Select,
    FormControl,
    FormLabel,
    FormErrorMessage
} from '@chakra-ui/react';
import { ILiquidityProfile } from '@typescript/services/participant';
import { useGetParticipantCurrencyList } from '@hooks/services/participant';
import { LiquidityHelper } from '@helpers/form';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isEmpty } from 'lodash-es';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ILiquidityProfile) => void;
    form: ILiquidityProfile;
    setForm: React.Dispatch<React.SetStateAction<ILiquidityProfile>>;
    isEdit: boolean;
}

const LiquidityProfileModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    form,
    setForm,
    isEdit }) => {

    const { data } = useGetParticipantCurrencyList();

    const liquidityHelper = new LiquidityHelper();

    const {
        control,
        handleSubmit,
        trigger,
        register,
        formState: { isValid, isDirty, errors },
        setValue,
        reset,
    } = useForm<ILiquidityProfile>({
        defaultValues: form,
        resolver: zodResolver(liquidityHelper.schema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (isOpen) {
            reset(form);
            if (isEdit && form?.liquidityProfileId) {
                setValue('liquidityProfileId', form.liquidityProfileId);
            } else {
                setValue('liquidityProfileId', '');
            }
        }
    }, [form, isOpen, isEdit, reset, setValue]);

    const liquidityHandler = (values: ILiquidityProfile) => {
        setForm(values);
        onSave(values);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {isEdit ? 'Edit Liquidity Profile' : 'Add Liquidity Profile'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>

                        {isEdit && (
                            <Controller
                                name="liquidityProfileId"
                                control={control}
                                render={({ field }) => <input type="hidden" {...field} />}
                            />
                        )}

                        <FormControl isInvalid={!isEmpty(errors.bankName)} isRequired>
                            <FormLabel>Bank Name</FormLabel>
                            <Controller
                                name="bankName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Bank Name" value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.bankName?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.accountName)} isRequired>
                            <FormLabel>Account Name</FormLabel>
                            <Controller
                                name="accountName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Account Name" value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.accountName?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.accountNumber)} isRequired>
                            <FormLabel>Account Number</FormLabel>
                            <Controller
                                name="accountNumber"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder="Account Number" value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.accountNumber?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.currency)} isRequired>
                            <FormLabel>Currency</FormLabel>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <Select {...field}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        placeholder="Select Currency">
                                        {data?.map((item, index) => (
                                            <option key={index} value={item.currency}>
                                                {item.currency}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            />
                            <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter display="flex" gap={3}>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        isDisabled={!isDirty || !isValid}
                        onClick={handleSubmit(liquidityHandler)}
                        colorScheme="blue" mr={3}>
                        {isEdit ? 'Save' : 'Add'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default LiquidityProfileModal;
