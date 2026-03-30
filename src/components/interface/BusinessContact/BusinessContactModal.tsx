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
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { IBusinessContact, BusinessContactType } from '@typescript/services/participant';
import { ContactHelper } from '@helpers/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomSelect } from '@components/interface';
import { isEmpty } from 'lodash-es';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface BusinessContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: IBusinessContact) => void;
  form: IBusinessContact;
  setForm: React.Dispatch<React.SetStateAction<IBusinessContact>>;
  isEdit: boolean;
  isSaving?: boolean;
}

const BusinessContactModal: React.FC<BusinessContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  isEdit,
  isSaving
}) => {
  const { t } = useTranslation();

  const contactHelper = new ContactHelper();

  const {
    control,
    handleSubmit,
    trigger,
    register,
    formState: { isValid, isDirty, errors },
    reset,
  } = useForm<IBusinessContact>({
    defaultValues: form,
    resolver: zodResolver(contactHelper.schema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (isOpen) {
      reset(form);
    }
  }, [form, isOpen, reset]);

  const contactHandler = (values: IBusinessContact) => {
    setForm(values);
    onSave(values);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? t('ui.edit_contact') : t('ui.add_contact')}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!isEmpty(errors.contactType)} isRequired>
              <FormLabel>{t('ui.contact_type')}</FormLabel>
              <Controller
                name="contactType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={Object.values(BusinessContactType).map((type) => ({
                      value: type,
                      label: type,
                    }))}
                    value={
                      field.value
                          ? { value: field.value,
                              label: field.value }
                          : null
                      }
                    onChange={(selectedOption) => {
                      field.onChange(selectedOption ? selectedOption.value : '');
                    }}
                    placeholder={t('ui.select_contact_type')}
                  />
                )}
              />
              <FormErrorMessage>{errors.contactType?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.name)} isRequired>
              <FormLabel>{t('ui.name')}</FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t('ui.name')} value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.position)} isRequired>
              <FormLabel>{t('ui.position')}</FormLabel>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t('ui.position')} value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.position?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.email)} isRequired>
              <FormLabel>{t('ui.email')}</FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="email" placeholder={t('ui.email')} value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.mobile)} isRequired>
              <FormLabel>{t('ui.contact_number')}</FormLabel>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder={t('ui.contact_number')} value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.mobile?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter display="flex" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            {t('ui.cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isDisabled={!isDirty || !isValid}
            isLoading={isSaving}
            loadingText={isEdit ? t('ui.saving') : t('ui.adding')}
            onClick={handleSubmit(contactHandler)} mr={3}>
            {isEdit ? t('ui.save') : t('ui.add')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

  );
};

export default BusinessContactModal;
