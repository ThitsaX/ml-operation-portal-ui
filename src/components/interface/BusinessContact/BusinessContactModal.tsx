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

interface BusinessContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: IBusinessContact) => void;
  form: IBusinessContact;
  setForm: React.Dispatch<React.SetStateAction<IBusinessContact>>;
  isEdit: boolean
}

const BusinessContactModal: React.FC<BusinessContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  form,
  setForm,
  isEdit
}) => {

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
        <ModalHeader>{isEdit ? 'Edit Contact' : 'Add Contact'}</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={!isEmpty(errors.contactType)}>
              <FormLabel>Contact Type</FormLabel>
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
                      trigger('contactType');
                    }}
                    placeholder="Select Contact Type"
                  />
                )}
              />
              <FormErrorMessage>{errors.contactType?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.name)}>
              <FormLabel>Person Name</FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Person Name" value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.position)}>
              <FormLabel>Position</FormLabel>
              <Controller
                name="position"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Position" value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.position?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.email)}>
              <FormLabel>Email</FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} type="email" placeholder="Email" value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!isEmpty(errors.mobile)}>
              <FormLabel>Contact Number</FormLabel>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Contact Number" value={field.value ?? ''} />
                )}
              />
              <FormErrorMessage>{errors.mobile?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter display="flex" gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isDisabled={!isDirty || !isValid}
            onClick={handleSubmit(contactHandler)} mr={3}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

  );
};

export default BusinessContactModal;
