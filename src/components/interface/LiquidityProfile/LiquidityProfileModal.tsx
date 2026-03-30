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
import { CustomSelect } from '@components/interface';
import { isEmpty } from 'lodash-es';
import { useTranslation } from 'react-i18next';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ILiquidityProfile) => void;
    form: ILiquidityProfile;
    setForm: React.Dispatch<React.SetStateAction<ILiquidityProfile>>;
    isEdit: boolean;
    isSaving: boolean;
}

const LiquidityProfileModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSave,
    form,
    setForm,
    isEdit,
    isSaving}) => {
    const { t } = useTranslation();

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
                    {isEdit ? t('ui.edit_liquidity_profile') : t('ui.add_liquidity_profile')}
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
                            <FormLabel>{t('ui.bank_name')}</FormLabel>
                            <Controller
                                name="bankName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t('ui.bank_name')} value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.bankName?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.accountName)} isRequired>
                            <FormLabel>{t('ui.account_name')}</FormLabel>
                            <Controller
                                name="accountName"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t('ui.account_name')} value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.accountName?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.accountNumber)} isRequired>
                            <FormLabel>{t('ui.account_number')}</FormLabel>
                            <Controller
                                name="accountNumber"
                                control={control}
                                render={({ field }) => (
                                    <Input {...field} placeholder={t('ui.account_number')} value={field.value ?? ''} />
                                )}
                            />
                            <FormErrorMessage>{errors.accountNumber?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.currency)} isRequired>
                            <FormLabel>{t('ui.currency')}</FormLabel>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <CustomSelect
                                        options={data?.map((item) => ({
                                            value: item.currency,
                                            label: item.currency,
                                        })) ?? []}
                                        value={ field.value
                                            ? { value: field.value,
                                                label: field.value }
                                            : null
                                        }
                                        onChange={(selectedOption) => {
                                            field.onChange(selectedOption?.value);
                                        }}
                                        placeholder={t('ui.select_currency')}
                                    />

                                )}
                            />
                            <FormErrorMessage>{errors.currency?.message}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter display="flex" gap={3}>
                    <Button variant="ghost" onClick={onClose}>
                        {t('ui.cancel')}
                    </Button>
                    <Button
                        isDisabled={!isDirty || !isValid}
                        isLoading={isSaving}
                        loadingText={isEdit ? t('ui.saving') : t('ui.adding')}
                        onClick={handleSubmit(liquidityHandler)}
                        colorScheme="blue" mr={3}>
                        {isEdit ? t('ui.save') : t('ui.add')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default LiquidityProfileModal;
