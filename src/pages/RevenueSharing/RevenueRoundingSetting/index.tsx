// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Button,
  Center,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@helpers/errors';
import { RevenueCard, RevenuePageShell } from '@pages/RevenueSharing/components';
import { hasActionPermission } from '@helpers/permissions';
import { useGetRevenueRoundingPolicy } from '@hooks/services/revenue-sharing';
import { createRevenueRoundingPolicy } from '@services/revenue-sharing';
import {
  type IApiErrorResponse,
  type RevenueRemainderRecipient,
  type RevenueRoundingMode
} from '@typescript/services';

const ROUNDING_OPTIONS: Array<{ labelKey: string; value: RevenueRoundingMode }> = [
  { labelKey: 'ui.rounding_up', value: 'UP' },
  { labelKey: 'ui.rounding_down', value: 'DOWN' }
];

const REMAINDER_RECIPIENT_OPTIONS: Array<{ labelKey: string; value: RevenueRemainderRecipient }> = [
  { labelKey: 'ui.gol_gra', value: 'GOL_GRA' },
  { labelKey: 'ui.ministries', value: 'MINISTRY' },
  { labelKey: 'ui.third_party_provider_short', value: 'THIRD_PARTY' },
  { labelKey: 'ui.dfsp', value: 'DFSP' }
];

const RevenueRoundingSetting = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [roundingMode, setRoundingMode] = useState<RevenueRoundingMode>('UP');
  const [remainderRecipient, setRemainderRecipient] = useState<RevenueRemainderRecipient>('GOL_GRA');
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetRevenueRoundingPolicy({
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (data) {
      setRoundingMode(data.roundingMode || 'UP');
      setRemainderRecipient(data.remainderRecipient || 'GOL_GRA');
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_fetch_revenue_rounding_policy'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [error, isError, t, toast]);

  const savePolicy = async () => {
    setIsSaving(true);
    try {
      await createRevenueRoundingPolicy({
        roundingMode,
        remainderRecipient
      });
      toast({
        position: 'top',
        description: t('ui.revenue_rounding_policy_saved_successfully'),
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      await refetch();
    } catch (error) {
      toast({
        position: 'top',
        description:
          getErrorMessage(error as IApiErrorResponse) ||
          t('ui.failed_to_save_revenue_rounding_policy'),
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = hasActionPermission('CreateRevenueRoundingPolicy');

  if (isLoading) {
    return (
      <Center flex={1} minH="400px">
        <VStack spacing={4}>
          <Spinner color="blue.500" />
          <Text color="gray.600" fontSize="sm">{t('ui.loading_revenue_rounding_policy')}</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <RevenuePageShell title={t('ui.revenue_rounding_setting')}>
      <RevenueCard
        title={t('ui.rounding_setting')}
        description={t('ui.rounding_setting_description')}
      >
        <RadioGroup
          value={roundingMode}
          onChange={(value) => setRoundingMode(value as RevenueRoundingMode)}
          isDisabled={!canSave || isFetching || isSaving}
        >
          <Stack spacing={3}>
            {ROUNDING_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value} colorScheme="blue">
                <Text fontSize="sm" fontWeight="medium">{t(option.labelKey)}</Text>
              </Radio>
            ))}
          </Stack>
        </RadioGroup>
      </RevenueCard>

      <RevenueCard
        title={t('ui.remainder_recipient')}
        description={t('ui.remainder_recipient_description')}
      >
        <RadioGroup
          value={remainderRecipient}
          onChange={(value) => setRemainderRecipient(value as RevenueRemainderRecipient)}
          isDisabled={!canSave || isFetching || isSaving}
        >
          <Stack spacing={3}>
            {REMAINDER_RECIPIENT_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value} colorScheme="blue">
                <Text fontSize="sm" fontWeight="medium">{t(option.labelKey)}</Text>
              </Radio>
            ))}
          </Stack>
        </RadioGroup>
      </RevenueCard>

      <Stack w="full" direction="row" justify="flex-end">
        <Button
          colorScheme="blue"
          onClick={savePolicy}
          isLoading={isSaving}
          isDisabled={!canSave || isFetching}
          px={8}
        >
          {t('ui.save')}
        </Button>
      </Stack>
    </RevenuePageShell>
  );
};

export default RevenueRoundingSetting;
