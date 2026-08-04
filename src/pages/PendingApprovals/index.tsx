// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Badge,
  Heading,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack
} from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { type ITimezoneOption } from 'react-timezone-select';
import { hasActionPermission } from '@helpers/permissions';
import { type RootState } from '@store';
import NdcThresholdApprovalsTab from './components/NdcThresholdApprovalsTab';
import ParticipantApprovalsTab from './components/ParticipantApprovalsTab';
import RevenueSharingApprovalsTab from './components/RevenueSharingApprovalsTab';


const PendingApprovals = () => {
  const { t } = useTranslation();
  const selectedTimezone = useSelector<RootState, ITimezoneOption>((state) => state.app.selectedTimezone);
  const [activeTab, setActiveTab] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [ndcThresholdCount, setNdcThresholdCount] = useState(0);
  const [revenueSharingCount, setRevenueSharingCount] = useState(0);
  const canViewNdcThresholdTab =
    hasActionPermission('SubmitNdcThresholdApproval') &&
    hasActionPermission('GetNdcThresholdApprovalList') &&
    hasActionPermission('ModifyNdcThresholdApprovalAction');
  const canViewRevenueSharingTab = hasActionPermission('GetPendingRevenueApprovalList');
  const revenueSharingTabIndex = canViewNdcThresholdTab ? 2 : 1;

  const handleParticipantCountChange = useCallback((count: number) => {
    setParticipantCount(count);
  }, []);

  const handleNdcThresholdCountChange = useCallback((count: number) => {
    setNdcThresholdCount(count);
  }, []);

  const handleRevenueSharingCountChange = useCallback((count: number) => {
    setRevenueSharingCount(count);
  }, []);

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={0} mt={10}>
      <Heading fontSize="2xl" fontWeight="bold" mb={6}>{t('ui.pending_approvals')}</Heading>

      <Tabs index={activeTab} onChange={setActiveTab} w="full" variant="unstyled">
        <TabList borderBottom="1px solid" borderColor="gray.200" gap={6}>
          <Tab
            px={1}
            pb={3}
            color="gray.700"
            borderBottom="3px solid"
            borderColor="transparent"
            fontWeight="semibold"
            _selected={{ color: 'primary', borderColor: 'primary' }}>
            <HStack spacing={3}>
              <Text>{t('ui.participant')}</Text>
              <Badge borderRadius="full" px={3} py={1} bg="purple.50" color="primary" fontSize="sm">
                {participantCount}
              </Badge>
            </HStack>
          </Tab>
          {canViewNdcThresholdTab && (
            <Tab
              px={1}
              pb={3}
              color="gray.700"
              borderBottom="3px solid"
              borderColor="transparent"
              fontWeight="semibold"
              _selected={{ color: 'primary', borderColor: 'primary' }}>
              <HStack spacing={3}>
                <Text>NDC Thresholds</Text>
                <Badge borderRadius="full" px={3} py={1} bg="purple.50" color="primary" fontSize="sm">
                  {ndcThresholdCount}
                </Badge>
              </HStack>
            </Tab>
          )}
          {canViewRevenueSharingTab && (
            <Tab
              px={1}
              pb={3}
              color="gray.700"
              borderBottom="3px solid"
              borderColor="transparent"
              fontWeight="semibold"
              _selected={{ color: 'primary', borderColor: 'primary' }}>
              <HStack spacing={3}>
                <Text>{t('ui.revenue_sharing')}</Text>
                <Badge borderRadius="full" px={3} py={1} bg="purple.50" color="primary" fontSize="sm">
                  {revenueSharingCount}
                </Badge>
              </HStack>
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={6} pb={0}>
            <ParticipantApprovalsTab
              selectedTZString={selectedTimezone.value}
              onCountChange={handleParticipantCountChange}
            />
          </TabPanel>
          {canViewNdcThresholdTab && (
            <TabPanel px={0} pt={6} pb={0}>
              <NdcThresholdApprovalsTab
                isActive={activeTab === 1}
                selectedTZString={selectedTimezone.value}
                onCountChange={handleNdcThresholdCountChange}
              />
            </TabPanel>
          )}
          {canViewRevenueSharingTab && (
            <TabPanel px={0} pt={6} pb={0}>
              <RevenueSharingApprovalsTab
                isActive={activeTab === revenueSharingTabIndex}
                selectedTZString={selectedTimezone.value}
                onCountChange={handleRevenueSharingCountChange}
              />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default PendingApprovals;


