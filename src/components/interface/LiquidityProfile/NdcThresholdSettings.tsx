// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { CustomSelect } from '@components/interface';
import { HeaderCell, Cell } from '@components/interface/Table';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { NdcThresholdHelper } from '@helpers/form';
import { useGetSchemeThresholdConfiguration } from '@hooks/services/ndc-configurations';
import { useGetParticipantCurrencyListByDfspId } from '@hooks/services/participant';
import {
  createNdcDfspConfiguration,
  createNdcThresholdApproval,
  getNdcDfspConfiguration,
  getThresholdDetailList,
  modifyNdcDfspConfiguration
} from '@services/ndc-configurations';
import { type INdcThresholdForm } from '@typescript/form';
import {
  type IApiErrorResponse,
  type INdcDfspConfiguration,
  type INdcThresholdDetail
} from '@typescript/services';

interface NdcThresholdSettingsProps {
  dfspId?: string;
}

const defaultThresholdForm: INdcThresholdForm = {
  currency: '',
  visualConfig: '',
  ndcConfig: '',
  status: true
};

const getConfigId = (config?: INdcDfspConfiguration | null) => {
  if (!config?.thresholdConfigurationId) return '';
  return String(config.thresholdConfigurationId);
};

const NdcThresholdSettings = ({ dfspId }: NdcThresholdSettingsProps) => {
  const { t } = useTranslation();
  const toast = useToast();
  const borderColor = useColorModeValue('gray', 'gray.600');
  const headerBg = useColorModeValue('gray.200', 'gray.500');
  const { data: currencyList } = useGetParticipantCurrencyListByDfspId(
    dfspId ?? ''
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const ndcThresholdHelper = new NdcThresholdHelper();
  const canSubmitNdcThresholdApproval = hasActionPermission('SubmitNdcThresholdApproval');
  const canModifyNdcThresholdApproval = hasActionPermission('ModifyNdcThresholdApprovalAction');
  const canModifyDfspThresholdConfiguration = hasActionPermission('ModifyDfspThresholdConfiguration');
  const isConfigurationSwitchPermissionDisabled = !canModifyDfspThresholdConfiguration;
  const thresholdTableColumnCount = canModifyNdcThresholdApproval ? 4 : 3;

  const [thresholdForm, setThresholdForm] =
    useState<INdcThresholdForm>(defaultThresholdForm);
  const [deleteItem, setDeleteItem] = useState<INdcThresholdDetail | null>(
    null
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [isDeletingThreshold, setIsDeletingThreshold] = useState(false);

  const schemeQuery = useGetSchemeThresholdConfiguration({
    retry: false,
    refetchOnWindowFocus: false
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid }
  } = useForm<INdcThresholdForm>({
    defaultValues: thresholdForm,
    resolver: zodResolver(ndcThresholdHelper.schema),
    mode: 'onChange'
  });

  const configQuery = useQuery<INdcDfspConfiguration, IApiErrorResponse>({
    queryKey: ['getNdcDfspConfiguration', dfspId],
    queryFn: () => getNdcDfspConfiguration(dfspId as string),
    enabled: Boolean(dfspId),
    retry: false,
    refetchOnWindowFocus: false
  });

  const thresholdConfigurationId = getConfigId(configQuery.data);

  const thresholdsQuery = useQuery<INdcThresholdDetail[], IApiErrorResponse>({
    queryKey: ['getThresholdDetailList', thresholdConfigurationId, true],
    queryFn: () => getThresholdDetailList({ thresholdConfigurationId, status: true }),
    enabled: Boolean(thresholdConfigurationId),
    refetchOnWindowFocus: false
  });

  const enabled = Boolean(configQuery.data?.thresholdEnabled);
  const thresholds = thresholdsQuery.data ?? [];
  const isSchemeConfigLoading = schemeQuery.isLoading || schemeQuery.isFetching;
  const isSchemeThresholdGateOff = schemeQuery.data?.thresholdEnabled === false;
  const isConfigLoading = configQuery.isLoading || configQuery.isFetching;
  const isThresholdsLoading = Boolean(thresholdConfigurationId) && (thresholdsQuery.isLoading || thresholdsQuery.isFetching);
  const configurationSwitchTooltipLabel = isConfigurationSwitchPermissionDisabled
    ? t('ui.no_permission_modify_dfsp_ndc_threshold_setting')
    : isSchemeThresholdGateOff
      ? t('ui.scheme_ndc_threshold_gate_off')
      : '';
  const isConfigurationSwitchTooltipHidden = !configurationSwitchTooltipLabel;

  const currencyOptions = useMemo(
    () =>
      currencyList?.map((item) => ({
        value: item.currency,
        label: item.currency
      })) ?? [],
    [currencyList]
  );

  useEffect(() => {
    if (isOpen) {
      reset(thresholdForm);
    }
  }, [isOpen, reset, thresholdForm]);

  const showError = (error: unknown, fallback: string) => {
    toast({
      position: 'top',
      status: 'error',
      description: getErrorMessage(error as IApiErrorResponse) || fallback,
      duration: 3000,
      isClosable: true
    });
  };

  const ensureConfiguration = async (nextEnabled = false) => {
    if (thresholdConfigurationId) return thresholdConfigurationId;
    if (!dfspId) throw new Error('DFSP id is required.');

    const created = await createNdcDfspConfiguration({
      scopeType: 'DFSP',
      dfspId,
      thresholdEnabled: nextEnabled
    });
    await configQuery.refetch();
    return String(created.thresholdConfigurationId);
  };

  const toggleConfiguration = async (nextEnabled: boolean) => {
    if (!canModifyDfspThresholdConfiguration || isSchemeThresholdGateOff) return;
    setIsSavingConfig(true);
    try {
      const id = await ensureConfiguration(nextEnabled);
      await modifyNdcDfspConfiguration(id, {
        thresholdEnabled: nextEnabled,
        status: 'ACTIVE'
      });
      toast({
        title: t('ui.success'),
        position: 'top',
        description: nextEnabled
          ? t('ui.ndc_threshold_notifications_enabled')
          : t('ui.ndc_threshold_notifications_disabled'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await configQuery.refetch();
      await thresholdsQuery.refetch();
    } catch (error) {
      showError(error, t('ui.failed_to_update_ndc_threshold_notification_setting'));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openAddModal = () => {
    setThresholdForm(defaultThresholdForm);
    onOpen();
  };

  const openEditModal = (item: INdcThresholdDetail) => {
    setThresholdForm({
      id: String(item.id),
      currency: item.currency,
      visualConfig: String(item.visualConfig),
      ndcConfig: String(item.ndcConfig),
      status: item.status
    });
    onOpen();
  };

  const saveThreshold = async (values: INdcThresholdForm) => {
    setIsSavingThreshold(true);
    try {
      const visualConfig = Number(values.visualConfig);
      const ndcConfig = Number(values.ndcConfig);

      if (!dfspId) {
        toast({
          position: 'top',
          status: 'warning',
          description: t('ui.dfsp_id_not_found'),
          duration: 3000,
          isClosable: true
        });
        return;
      }

      if (values.id) {
        const originalThreshold = thresholds.find(
          (item) => String(item.id) === String(values.id)
        );
        const visualChanged = originalThreshold?.visualConfig !== visualConfig;
        const notificationChanged = originalThreshold?.ndcConfig !== ndcConfig;

        if (!visualChanged && !notificationChanged) {
          toast({
            position: 'top',
            status: 'warning',
            description: t('ui.no_threshold_changes_found'),
            duration: 3000,
            isClosable: true
          });
          return;
        }

        await createNdcThresholdApproval({
          operation: visualChanged && notificationChanged
            ? 'UPDATE_NDC_VISUAL_AND_NOTIFICATION_ALERT'
            : visualChanged
              ? 'UPDATE_NDC_VISUAL_ALERT'
              : 'UPDATE_NDC_NOTIFICATION_ALERT',
          participantName: dfspId,
          thresholdDetailId: String(values.id),
          currency: values.currency,
          ...(visualChanged ? { visualConfig } : {}),
          ...(notificationChanged ? { notificationConfig: ndcConfig } : {})
        });
      } else {
        await createNdcThresholdApproval({
          operation: 'CREATE_NDC_ALERT_THRESHOLD',
          participantName: dfspId,
          currency: values.currency,
          visualConfig,
          notificationConfig: ndcConfig
        });
      }

      toast({
        title: values.id
          ? t('ui.currency_threshold_update_request_submitted')
          : t('ui.currency_threshold_create_request_submitted'),
        position: 'top',
        description: `${t('ui.currency')}: ${values.currency}, Visual Alert: ${visualConfig}%, Notification Alert: ${ndcConfig}%`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await thresholdsQuery.refetch();
      onClose();
    } catch (error) {
      showError(error, t('ui.failed_to_save_currency_threshold'));
    } finally {
      setIsSavingThreshold(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;

    setIsDeletingThreshold(true);
    try {
      if (!dfspId) {
        toast({
          position: 'top',
          status: 'warning',
          description: t('ui.dfsp_id_not_found'),
          duration: 3000,
          isClosable: true
        });
        return;
      }

      await createNdcThresholdApproval({
        operation: 'DELETE_NDC_ALERT_THRESHOLD',
        participantName: dfspId,
        thresholdDetailId: String(deleteItem.id),
        currency: deleteItem.currency
      });
      toast({
        title: t('ui.success'),
        position: 'top',
        description: t('ui.currency_threshold_delete_request_submitted', { currency: deleteItem.currency }),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await thresholdsQuery.refetch();
      setDeleteItem(null);
    } catch (error) {
      showError(error, t('ui.failed_to_remove_currency_threshold'));
    } finally {
      setIsDeletingThreshold(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6} w="full">
      <Box
        width="100%"
        p={4}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="md">
        <VStack align="flex-start" spacing={4} w="full">
          <HStack justify="space-between" align="center" w="full">
            <Box>
              <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                NDC Threshold Notification Setting
              </Text>
              <Text color="gray.600" fontSize="sm" mt={1}>
                Top-level switch for NDC threshold display and notifications.
              </Text>
            </Box>
            <HStack spacing={3}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={enabled ? 'green.600' : 'gray.500'}>
                {enabled ? t('ui.active') : t('ui.inactive')}
              </Text>
              <Tooltip
                label={configurationSwitchTooltipLabel}
                isDisabled={isConfigurationSwitchTooltipHidden}
                placement="top"
                hasArrow
                maxW="260px"
                px={3}
                py={2}
                borderRadius="md"
                bg="white"
                color="gray.800"
                boxShadow="md"
                fontSize="sm">
                <Box as="span" display="inline-flex">
                  <Switch
                    colorScheme="green"
                    isChecked={enabled}
                    isDisabled={isSavingConfig || isConfigLoading || isSchemeConfigLoading || !dfspId || isConfigurationSwitchPermissionDisabled || isSchemeThresholdGateOff}
                    onChange={(event) => toggleConfiguration(event.target.checked)}
                  />
                </Box>
              </Tooltip>
            </HStack>
          </HStack>

          {isSchemeConfigLoading ? (
            <HStack color="gray.600">
              <Spinner size="sm" />
              <Text fontSize="sm">Loading scheme NDC threshold configuration...</Text>
            </HStack>
          ) : isSchemeThresholdGateOff ? (
            <Box
              p={3}
              bg="orange.50"
              border="1px solid"
              borderColor="orange.200"
              rounded="md"
              w="full">
              <Text fontSize="sm" color="orange.800">
                {t('ui.enable_scheme_ndc_threshold_gate_first')}
              </Text>
            </Box>
          ) : isConfigLoading ? (
            <HStack color="gray.600">
              <Spinner size="sm" />
              <Text fontSize="sm">Loading DFSP configuration...</Text>
            </HStack>
          ) : configQuery.isError ? (
            <Box
              p={3}
              bg="orange.50"
              border="1px solid"
              borderColor="orange.200"
              rounded="md"
              w="full">
              <Text fontSize="sm" color="orange.800">
                Activate the NDC threshold setting for {dfspId} first.
              </Text>
            </Box>
          ) : null}

          <VStack align="stretch" spacing={0} w="full">
            <HStack
              justify="space-between"
              py={3}
              borderTop="1px solid"
              borderColor="gray.200">
              <Box>
                <Text fontWeight="semibold">If setting is off</Text>
                <Text color="gray.600" fontSize="sm" mt={1}>
                  No threshold lookup, no outbox record, and no notification is
                  sent.
                </Text>
              </Box>
              <Badge
                colorScheme="red"
                borderRadius="full"
                px={4}
                py={2}
                textTransform="none"
                fontSize="sm">
                Stop
              </Badge>
            </HStack>
            <HStack
              justify="space-between"
              py={3}
              borderTop="1px solid"
              borderColor="gray.200">
              <Box>
                <Text fontWeight="semibold">If setting is on</Text>
                <Text color="gray.600" fontSize="sm" mt={1}>
                  Evaluate each currency threshold and send notifications on
                  breach.
                </Text>
              </Box>
              <Badge
                colorScheme="green"
                borderRadius="full"
                px={4}
                py={2}
                textTransform="none"
                fontSize="sm">
                Continue
              </Badge>
            </HStack>
          </VStack>
        </VStack>
      </Box>

      <Box
        width="100%"
        p={4}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="md"
        mb={6}>
        <VStack align="flex-start" spacing={4} w="full">
          <HStack justify="space-between" align="center" w="full">
            <Box>
              <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                NDC Thresholds
              </Text>
              <Text color="gray.600" fontSize="sm" mt={1}>
                Set the visual alert and notification alert level for each
                currency.
              </Text>
            </Box>
            {canSubmitNdcThresholdApproval ? (
              <Button
                colorScheme="blue"
                size="md"
                onClick={openAddModal}
                isDisabled={!dfspId || isSchemeConfigLoading || isSchemeThresholdGateOff}>
                {t('ui.add')}
              </Button>
            ) : null}
          </HStack>

          <TableContainer
            border={`1px solid ${borderColor}`}
            borderRadius="sm"
            w="full">
            <Table variant="unstyled">
              <Thead bg={headerBg}>
                <Tr>
                  <HeaderCell borderColor={borderColor}>
                    {t('ui.currency')}
                  </HeaderCell>
                  <HeaderCell borderColor={borderColor}>
                    Visual Alert
                  </HeaderCell>
                  <HeaderCell borderColor={borderColor}>
                    Notification Alert
                  </HeaderCell>
                  {canModifyNdcThresholdApproval ? (
                    <HeaderCell borderColor={borderColor}>
                      {t('ui.action')}
                    </HeaderCell>
                  ) : null}
                </Tr>
              </Thead>
              <Tbody>
                {isConfigLoading ? (
                  <Tr>
                    <Cell borderColor={borderColor} colSpan={thresholdTableColumnCount}>
                      <HStack justify="center">
                        <Spinner size="sm" />
                        <Text>Loading DFSP configuration...</Text>
                      </HStack>
                    </Cell>
                  </Tr>
                ) : configQuery.isError || !thresholdConfigurationId ? (
                  <Tr>
                    <Cell borderColor={borderColor} colSpan={thresholdTableColumnCount}>
                      NDC threshold notifications are not active yet.
                    </Cell>
                  </Tr>
                ) : thresholdsQuery.isError ? (
                  <Tr>
                    <Cell borderColor={borderColor} colSpan={thresholdTableColumnCount}>
                      Failed to load currency thresholds.
                    </Cell>
                  </Tr>
                ) : isThresholdsLoading ? (
                  <Tr>
                    <Cell borderColor={borderColor} colSpan={thresholdTableColumnCount}>
                      <HStack justify="center">
                        <Spinner size="sm" />
                        <Text>Loading thresholds...</Text>
                      </HStack>
                    </Cell>
                  </Tr>
                ) : thresholds.length === 0 ? (
                  <Tr>
                    <Cell borderColor={borderColor} colSpan={thresholdTableColumnCount}>
                      {canSubmitNdcThresholdApproval
                        ? 'No currency thresholds yet. Use Add to create one.'
                        : 'No currency thresholds yet.'}
                    </Cell>
                  </Tr>
                ) : null}
                {!isConfigLoading && !configQuery.isError && !thresholdsQuery.isError && thresholdConfigurationId && thresholds.map((item) => (
                  <Tr key={String(item.id)}>
                    <Cell borderColor={borderColor} fontWeight="semibold">
                      {item.currency}
                    </Cell>
                    <Cell borderColor={borderColor}>{item.visualConfig}%</Cell>
                    <Cell borderColor={borderColor}>{item.ndcConfig}%</Cell>
                    {canModifyNdcThresholdApproval ? (
                      <Td border={`1px solid ${borderColor}`} px={4} py={2}>
                        <HStack spacing={3} justify="center">
                          <Tooltip
                            label={isSchemeThresholdGateOff ? t('ui.enable_scheme_ndc_threshold_gate_first') : 'Edit threshold'}
                            shouldWrapChildren
                            bg="white"
                            color="black">
                            <IconButton
                              aria-label={t('ui.edit')}
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                              isDisabled={isSchemeThresholdGateOff}
                              onClick={() => openEditModal(item)}
                            />
                          </Tooltip>
                          <Tooltip
                            label={isSchemeThresholdGateOff ? t('ui.enable_scheme_ndc_threshold_gate_first') : 'Delete threshold'}
                            shouldWrapChildren
                            bg="white"
                            color="black">
                            <IconButton
                              aria-label={t('ui.delete')}
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              isDisabled={isSchemeThresholdGateOff}
                              onClick={() => setDeleteItem(item)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    ) : null}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                {thresholdForm.id
                  ? 'Edit Currency Threshold'
                  : 'Add Currency Threshold'}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4}>
                  <FormControl isInvalid={Boolean(errors.currency)} isRequired>
                    <FormLabel>{t('ui.currency')}</FormLabel>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={currencyOptions}
                          value={
                            field.value
                              ? {
                                  value: String(field.value),
                                  label: String(field.value)
                                }
                              : null
                          }
                          onChange={(selectedOption) =>
                            field.onChange(selectedOption?.value ?? '')
                          }
                          placeholder={t('ui.select_currency')}
                        />
                      )}
                    />
                    <FormErrorMessage>
                      {errors.currency?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl
                    isInvalid={Boolean(errors.visualConfig)}
                    isRequired>
                    <FormLabel>Visual alert (%)</FormLabel>
                    <Controller
                      name="visualConfig"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      )}
                    />
                    <FormErrorMessage>
                      {errors.visualConfig?.message}
                    </FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={Boolean(errors.ndcConfig)} isRequired>
                    <FormLabel>Notification alert (%)</FormLabel>
                    <Controller
                      name="ndcConfig"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value ?? ''}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                        />
                      )}
                    />
                    <FormErrorMessage>
                      {errors.ndcConfig?.message}
                    </FormErrorMessage>
                  </FormControl>
                </VStack>
              </ModalBody>
              <ModalFooter display="flex" gap={3}>
                <Button variant="ghost" onClick={onClose}>
                  {t('ui.cancel')}
                </Button>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={handleSubmit(saveThreshold)}
                  isDisabled={!isDirty || !isValid}
                  isLoading={isSavingThreshold}
                  loadingText={t('ui.saving')}>
                  {t('ui.save')}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <AlertDialog
            isOpen={Boolean(deleteItem)}
            leastDestructiveRef={cancelDeleteRef}
            onClose={() => setDeleteItem(null)}>
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Currency Threshold
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to delete the{' '}
                  <Text as="span" fontWeight="bold">
                    {deleteItem?.currency ?? ''}
                  </Text>{' '}
                  threshold?
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button
                    ref={cancelDeleteRef}
                    onClick={() => setDeleteItem(null)}>
                    {t('ui.cancel')}
                  </Button>
                  <Button
                    colorScheme="blue"
                    ml={3}
                    isLoading={isDeletingThreshold}
                    onClick={confirmDelete}>
                    {t('ui.delete')}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </VStack>
      </Box>
    </VStack>
  );
};

export default NdcThresholdSettings;


