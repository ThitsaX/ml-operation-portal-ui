// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { type ITimezoneOption } from 'react-timezone-select';
import {
  Box,
  Center,
  Flex,
  Grid,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import { getErrorMessage } from '@helpers/errors';
import { hasActionPermission } from '@helpers/permissions';
import { type RootState } from '@store';
import {
  useGetSchemeThresholdConfiguration,
  useGetNdcWorkerConfigurationByJobName,
} from '@hooks/services/ndc-configurations';
import {
  modifyNdcSchemeConfiguration,
  modifyWorkerConfig
} from '@services/ndc-configurations';
import {
  InfoCard,
  SchemeGateCard,
  WorkerIntervalCard
} from './components';
import {
  DEFAULT_WORKER_MINUTES,
  buildWorkerPayload,
  getConfigId,
  intervalToMinutes,
  normalizeIntervalInput
} from './utils';

const NdcAlertSettings = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (state) => state.app.selectedTimezone
  );
  const [schemeEnabled, setSchemeEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState<string>(
    String(DEFAULT_WORKER_MINUTES)
  );
  const [intervalError, setIntervalError] = useState('');
  const [isSavingScheme, setIsSavingScheme] = useState(false);
  const [isSavingWorker, setIsSavingWorker] = useState(false);

  const {
    data: schemeConfiguration,
    error: schemeConfigurationError,
    isError: isSchemeConfigurationError,
    isFetching: isSchemeConfigurationFetching,
    isLoading: isSchemeConfigurationLoading,
    refetch: refetchSchemeConfiguration
  } = useGetSchemeThresholdConfiguration({
    refetchOnWindowFocus: false
  });

  const {
    data: workerConfiguration,
    error: workerConfigurationError,
    isError: isWorkerConfigurationError,
    isLoading: isWorkerConfigurationLoading,
    refetch: refetchWorkerConfiguration
  } = useGetNdcWorkerConfigurationByJobName({
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (schemeConfiguration) {
      setSchemeEnabled(Boolean(schemeConfiguration.thresholdEnabled));
    }
  }, [schemeConfiguration]);

  useEffect(() => {
    if (workerConfiguration) {
      setIntervalMinutes(
        String(
          intervalToMinutes(
            workerConfiguration.runEvery,
            intervalToMinutes(workerConfiguration.cronExpression)
          )
        )
      );
    }
  }, [workerConfiguration]);

  const workerConfigId = useMemo(
    () => getConfigId(workerConfiguration?.schedulerConfigId),
    [workerConfiguration?.schedulerConfigId]
  );

  const normalizedIntervalMinutes = Number(intervalMinutes);
  const isWorkerIntervalInvalid =
    !intervalMinutes ||
    !Number.isFinite(normalizedIntervalMinutes) ||
    normalizedIntervalMinutes < 1 ||
    Boolean(intervalError);
  const isLoading =
    isSchemeConfigurationLoading || isWorkerConfigurationLoading;
  const schemeStatus = schemeEnabled ? 'ON' : 'OFF';
  const canModifyThresholdConfiguration = hasActionPermission('ModifyThresholdConfiguration');
  const canModifySchedulerConfig = hasActionPermission('ModifySchedulerConfig');

  const saveSchemeState = async (nextValue: boolean) => {
    const id = getConfigId(schemeConfiguration?.thresholdConfigurationId);
    if (!id) {
      toast({
        position: 'top',
        status: 'error',
        description: 'Scheme configuration id was not found.',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    const previousValue = schemeEnabled;
    setSchemeEnabled(nextValue);
    setIsSavingScheme(true);

    try {
      await modifyNdcSchemeConfiguration(id, {
        thresholdEnabled: nextValue,
        status: 'ACTIVE'
      });
      toast({
        title: 'Success',
        position: 'top',
        status: 'success',
        description: `Scheme gate ${nextValue ? 'enabled' : 'disabled'}.`,
        duration: 3000,
        isClosable: true
      });
      refetchSchemeConfiguration();
    } catch (error: any) {
      setSchemeEnabled(previousValue);
      toast({
        position: 'top',
        status: 'error',
        description: getErrorMessage(error) || 'Failed to update scheme gate.',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSavingScheme(false);
    }
  };

  const handleIntervalChange = (value: string) => {
    const nextValue = normalizeIntervalInput(value);
    setIntervalMinutes(nextValue);
    setIntervalError(
      !nextValue || Number(nextValue) >= 1
        ? ''
        : 'Minimum interval is 1 minute.'
    );
  };

  const handleIntervalBlur = () => {
    if (!intervalMinutes) {
      setIntervalMinutes('1');
      setIntervalError('');
      return;
    }

    if (Number(intervalMinutes) < 1) {
      setIntervalError('Minimum interval is 1 minute.');
    }
  };

  const saveWorkerInterval = async () => {
    if (!workerConfigId) {
      toast({
        position: 'top',
        status: 'warning',
        description: 'Worker scheduler configuration was not found.',
        duration: 4000,
        isClosable: true
      });
      return;
    }

    if (
      !Number.isFinite(normalizedIntervalMinutes) ||
      normalizedIntervalMinutes < 1
    ) {
      setIntervalError('Minimum interval is 1 minute.');
      return;
    }

    setIntervalMinutes(String(normalizedIntervalMinutes));
    setIntervalError('');
    setIsSavingWorker(true);

    try {
      await modifyWorkerConfig(
        workerConfigId,
        buildWorkerPayload(
          workerConfiguration,
          normalizedIntervalMinutes,
          selectedTimezone?.value
        )
      );
      toast({
        title: 'Success',
        position: 'top',
        status: 'success',
        description: 'Worker interval saved.',
        duration: 3000,
        isClosable: true
      });
      refetchWorkerConfiguration();
    } catch (error: any) {
      toast({
        position: 'top',
        status: 'error',
        description:
          getErrorMessage(error) || 'Failed to save worker interval.',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSavingWorker(false);
    }
  };

  if (isLoading) {
    return (
      <Center flex={1} minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.600" fontSize="sm">
            Loading NDC alert settings...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.ndc_alert_settings')}</Heading>

      <Box w="full" bg="white" py={{ base: 4, md: 6 }}>
        <VStack align="flex-start" w="full" spacing={4}>
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', md: 'flex-end' }}
            direction={{ base: 'column', md: 'row' }}
            gap={3}
            w="full">
            <Box>
              <Text
                as="h2"
                color="gray.800"
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                lineHeight="1.25">
                Scheme gate and worker interval
              </Text>
              <Text
                mt={2}
                color="gray.600"
                fontSize="sm"
                maxW="4xl"
                lineHeight="1.7">
                This page combines the scheme gate picture with worker interval
                control. If scheme is OFF, the system should do nothing. If scheme
                is ON, the worker must check DFSP enablement and then evaluate the
                threshold.
              </Text>
            </Box>
          </Flex>

        {(isSchemeConfigurationError || isWorkerConfigurationError) && (
          <Box
            w="full"
            p={4}
            bg="red.50"
            border="1px solid"
            borderColor="red.200"
            rounded="md">
            <Text color="red.700" fontWeight="semibold">
              {isSchemeConfigurationError
                ? getErrorMessage(schemeConfigurationError as any) ||
                  'Could not load scheme configuration.'
                : getErrorMessage(workerConfigurationError as any) ||
                  'Could not load worker configuration.'}
            </Text>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} w="full">
          <InfoCard
            title="Scheme status"
            value={schemeStatus}
            helper="Master gate"
          />
          <InfoCard
            title="DFSP check"
            value={schemeEnabled ? 'Required' : 'Skipped'}
            helper="Runs only when scheme is ON"
          />
          <InfoCard title="If off" value="No-op" helper="No threshold lookup" />
          <InfoCard
            title="Next action"
            value={schemeEnabled ? 'Check DFSP' : 'Do nothing'}
            helper="Depends on scheme toggle"
          />
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} w="full">
          <SchemeGateCard
            isEnabled={schemeEnabled}
            isSaving={isSavingScheme}
            isFetching={isSchemeConfigurationFetching}
            isToggleDisabled={!canModifyThresholdConfiguration}
            onToggle={saveSchemeState}
          />
          <WorkerIntervalCard
            intervalMinutes={intervalMinutes}
            intervalError={intervalError}
            isSaving={isSavingWorker}
            isSaveDisabled={isWorkerIntervalInvalid}
            isControlDisabled={!canModifySchedulerConfig}
            onIntervalChange={handleIntervalChange}
            onIntervalBlur={handleIntervalBlur}
            onSave={saveWorkerInterval}
          />
        </Grid>
        </VStack>
      </Box>
    </VStack>
  );
};

export default memo(NdcAlertSettings);
