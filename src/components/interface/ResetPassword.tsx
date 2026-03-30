import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Button,
    VStack,
    useToast,
    InputGroup,
    InputRightElement,
    IconButton
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEmpty } from "lodash";
import { resetPasswordUser } from "@services/participant";
import { ParticipantHelper } from "@helpers/form";
import { type IResetPasswordValues } from "@typescript/form";
import { useEffect, useState } from "react";
import { type IApiErrorResponse } from "@typescript/services";
import { getErrorMessage } from "@helpers/errors";
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

const participantUser = new ParticipantHelper()

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: { userId: string; email: string } | null;
    onSuccess: () => void;
}

export default function ResetPasswordModal({
    isOpen,
    onClose,
    user,
    onSuccess,
}: ResetPasswordModalProps) {
    const toast = useToast();
    const { t } = useTranslation();
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isValid },
        reset,
    } = useForm<IResetPasswordValues & { confirmPassword: string }>({
        resolver: zodResolver(participantUser.resetPasswordSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                email: user.email,
                newPassword: "",
                confirmPassword: "",
            });
        }
    }, [user, reset]);

    const onSubmitHandler = async (values: IResetPasswordValues & { confirmPassword: string }) => {
        try {
            setIsSaving(true);
            await resetPasswordUser({ email: values.email, newPassword: values.newPassword });
            toast({
                position: "top",
                status: "success",
                description: t('ui.password_reset_successfully'),
                duration: 3000,
                isClosable: true,
            });
            reset();
            onClose();
            onSuccess();
        } catch (error: any) {
            const err = error as IApiErrorResponse;
            toast({
                position: "top",
                status: "error",
                description: getErrorMessage(err) || t('ui.failed_to_reset_password'),
                duration: 3000,
                isClosable: true,
            });
        }finally {
        setIsSaving(false);
    }
    };

    const handleCancel = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} isCentered>
            <ModalOverlay />
            <ModalContent rounded="lg" shadow="xl"
                w={{ base: "90%", md: "500px" }}
                maxW="90%"
                mx="auto"
            >
                <ModalHeader>{t('ui.reset_password')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isInvalid={!isEmpty(errors.email)}>
                            <FormLabel>{t('ui.email')}</FormLabel>
                            <Input type="text" {...register("email")} isDisabled />
                            <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.newPassword)} isRequired>
                            <FormLabel>{t('ui.new_password')}</FormLabel>
                            <InputGroup>
                                <Input type={showPassword ? "text" : "password"} {...register("newPassword")} />
                                <InputRightElement>
                                    <IconButton
                                        variant="ghost"
                                        aria-label={t('ui.show_password')}
                                        icon={showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                        bg="transparent"
                                        rounded="full"
                                        size="sm"
                                        _hover={{
                                            bg: 'transparent'
                                        }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>{errors.newPassword?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!isEmpty(errors.confirmPassword)} isRequired>
                            <FormLabel>{t('ui.confirm_password')}</FormLabel>
                            <InputGroup>
                                <Input type={showConfirmPassword  ? "text" : "password"} {...register("confirmPassword")} />
                                <InputRightElement>
                                <IconButton
                                    variant="ghost"
                                    aria-label={t('ui.show_password')}
                                    icon={showConfirmPassword  ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                    bg="transparent"
                                    rounded="full"
                                    size="sm"
                                    _hover={{
                                        bg: 'transparent'
                                    }}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter display="flex" gap={3}>
                    <Button variant="ghost" onClick={handleCancel}>
                        {t('ui.cancel')}
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit(onSubmitHandler)}
                        isDisabled={!isDirty || !isValid}
                        isLoading={isSaving}
                        loadingText={t('ui.saving')}
                    >
                        {t('ui.save')}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
