// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import { memo } from 'react';
import { Box, IconButton, Link, VStack } from '@chakra-ui/react';
import SideBarAccordion from './SideBarAccordion';
import SideBarItem from './SideBarItem';
import { FiHome, FiRepeat, FiBarChart2, FiHelpCircle, FiMenu, FiBell, FiFileText, FiSettings as FiAdmin, FiDollarSign } from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { AiOutlineAudit } from 'react-icons/ai';
import { MdPendingActions } from 'react-icons/md';
import { FaHandshake } from 'react-icons/fa';
import { IoPeopleCircle } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

const DEFAULT_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

interface SideBarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
  width: number; // px
  headerHeight: string; // e.g. '64px'
}

const SideBar = ({ collapsed, toggleCollapse, width = DEFAULT_WIDTH, headerHeight }: SideBarProps) => {
  const { t } = useTranslation();

  return (
    <Box
      position="absolute"
      top={headerHeight}
      left={0}
      zIndex={1}
      transition="width 160ms ease-in-out"
      width={`${collapsed ? COLLAPSED_WIDTH : width}px`}
      background="rgba(255,255,255,0.95)"
      borderRight="1px solid var(--chakra-colors-gray-100)"
      height={`calc(100vh - ${headerHeight})`}
      display="flex"
      flexDirection="column"
    >
      {/* TOP: title + burger */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'space-between'}
        px={collapsed ? 0 : 4}
        py={collapsed ? 3 : 5}
      >
        {!collapsed && (
          <Box textAlign="center">
            <Box
              as="div"
              fontSize="xs"
              fontWeight="bold"
              color="teal.700"
              letterSpacing="widest"
              textTransform="uppercase"
            >
              {t('ui.operational_portal')}
            </Box>
          </Box>
        )}

        <IconButton
          aria-label={t('ui.toggle_sidebar_aria')}
          icon={<FiMenu />}
          size="sm"
          variant="ghost"
          onClick={toggleCollapse}
        />
      </Box>

      {/* NAV */}
      <Box as="nav" flex="1" overflowY="auto" justifyContent="center">
        <VStack align="stretch" spacing={2} m={2}>
          <SideBarItem
            to="/home"
            id="1"
            icon={<FiHome />}
            label={t('ui.home')}
            collapsed={collapsed}
            menuId="home"
          />

          <SideBarAccordion
            icon={<HiOutlineBuildingLibrary />}
            label={t('ui.participant')}
            collapsed={collapsed}
            menuId="participants"
            items={[
              {
                id: 'position',
                label: t('ui.participant_positions'),
                to: '/participant/position',
                menuId: 'participant_positions',
              },
            ]}
          />

          <SideBarAccordion
            icon={<IoPeopleCircle />}
            label={t('ui.user_management')}
            collapsed={collapsed}
            menuId="user_management"
            items={[
              {
                id: 'user',
                label: t('ui.user'),
                to: '/user-management/user',
                menuId: 'users',
              },
            ]}
          />

          <SideBarItem
            to="/transfers"
            id="3"
            icon={<FiRepeat />}
            label={t('ui.transfers')}
            collapsed={collapsed}
            menuId="transfers"
          />

          <SideBarAccordion
            icon={<FaHandshake />}
            label={t('ui.settlement')}
            collapsed={collapsed}
            menuId="settlement"
            items={[
              {
                id: 'settlementModels',
                label: t('ui.settlement_models'),
                to: 'settlement/settlement-models',
                menuId: 'settlement_models',
              },
              {
                id: 'settlementWindows',
                label: t('ui.settlement_windows'),
                to: 'settlement/settlement-windows',
                menuId: 'settlement_windows',
              },
              {
                id: 'finalizeSettlement',
                label: t('ui.finalize_settlements'),
                to: 'settlement/finalize-settlement',
                menuId: 'finalize_settlement',
              },
            ]}
          />

          <SideBarAccordion
            icon={<FiBarChart2 />}
            label={t('ui.reports')}
            collapsed={collapsed}
            menuId="reports"
            items={[
              {
                id: 'settlementBankReport',
                label: t('ui.settlement_bank_report'),
                to: 'reports/settlement-bank-report',
                menuId: 'settlement_bank_report',
              },
              {
                id: 'settlementBankReportUseCase',
                label: t('ui.settlement_bank_report_usecase'),
                to: 'reports/settlement-bank-report-usecase',
                menuId: 'settlement_bank_report_usecase',
              },
              {
                id: 'settlementOverviewReport',
                label: t('ui.dfsp_settlement_overview_report'),
                to: 'reports/dfsp-settlement-overview-report',
                menuId: 'dfsp_settlement_overview_report',
              },
              {
                id: 'settlementDetailReport',
                label: t('ui.settlement_detail_report'),
                to: 'reports/settlement-detail-report',
                menuId: 'settlement_detail_report',
              },
              {
                id: 'settlementSummary',
                label: t('ui.settlement_summary_report'),
                to: 'reports/settlement-summary-report',
                menuId: 'settlement_summary_report',
              },
              {
                id: 'settlementStatementReport',
                label: t('ui.settlement_statement_report'),
                to: 'reports/settlement-statement-report',
                menuId: 'settlement_statement_report',
              },
              {
                id: 'settlementAuditReport',
                label: t('ui.settlement_audit_report'),
                to: 'reports/settlement-audit-report',
                menuId: 'settlement_audit_report',
              },
              {
                id: 'auditReport',
                label: t('ui.audit_report'),
                to: 'reports/audit-report',
                menuId: 'audit_report',
              },
              {
                id: 'transactionDetailReport',
                label: t('ui.transaction_detail_report'),
                to: 'reports/transaction-detail-report',
                menuId: 'transaction_detail_report',
              },
              {
                id: 'ManagementSummaryReport',
                label: t('ui.management_summary_report'),
                to: 'reports/management-summary-report',
                menuId: 'management_summary_report',
              },
              {
                id: 'TransferSettlementReport',
                label: t('ui.transfer_settlement_report'),
                to: 'reports/transfer-settlement-report',
                menuId: 'transfer_settlement_report',
              },
              {
                id: 'FeeSettlementReport',
                label: t('ui.fee_settlement_report'),
                to: 'reports/fee-settlement-report',
                menuId: 'fee_settlement_report',
              },
              {
                id: 'FeeSettlementSummaryReport',
                label: t('ui.fee_settlement_summary_report'),
                to: 'reports/fee-settlement-summary-report',
                menuId: 'fee_settlement_summary_report',
              },
              {
                id: 'FeeSummaryReport',
                label: t('ui.fee_summary_report'),
                to: 'reports/fee-summary-report',
                menuId: 'fee_summary_report',
              },
              {
                id: 'revenueSharingSummaryReport',
                label: t('ui.revenue_sharing_summary_report'),
                to: 'reports/revenue-sharing-summary-report',
                menuId: 'revenue_sharing_summary_report',
              },
              {
                id: 'revenueSharingDetailReport',
                label: t('ui.revenue_sharing_detail_report'),
                to: 'reports/revenue-sharing-detail-report',
                menuId: 'revenue_sharing_detail_report',
              },
            ]}
          />

          <SideBarItem
            to="/pending-approvals"
            id="5"
            icon={<MdPendingActions />}
            label={t('ui.pending_approvals')}
            collapsed={collapsed}
            menuId="pending_approvals"
          />

          <SideBarItem
            to="/audit"
            id="6"
            icon={<AiOutlineAudit />}
            label={t('ui.audit')}
            collapsed={collapsed}
            menuId="audit"
          />

          <SideBarItem
            to="/support-center"
            id="7"
            icon={<FiHelpCircle />}
            label={t('ui.support_center')}
            collapsed={collapsed}
            menuId="support_center"
          />


          <SideBarItem
            to="/notification-delivery-log"
            id="8"
            icon={<FiFileText />}
            label={t('ui.notification_delivery_log')}
            collapsed={collapsed}
            menuId="notification_delivery_log"
          />

          <SideBarItem
            to="/ndc-alert-settings"
            id="9"
            icon={<FiBell />}
            label={t('ui.ndc_alert_settings')}
            collapsed={collapsed}
            menuId="ndc_alert_settings"
          />

          <SideBarAccordion
            icon={<FiAdmin />}
            label={t('ui.system_settings')}
            collapsed={collapsed}
            menuId="system_admin"
            items={[
              {
                id: 'rolePermissions',
                label: t('ui.role_permissions'),
                to: '/system-admin/role-permission',
                menuId: 'role_permission'
              }
            ]}
          />

          <SideBarAccordion
            icon={<FiDollarSign />}
            label={t('ui.revenue_sharing_settings')}
            collapsed={collapsed}
            menuId="revenue_sharing_settings"
            items={[
              {
                id: 'partyRegistry',
                label: t('ui.party_registry'),
                to: '/revenue-sharing/party-registry',
                menuId: 'party_registry',
              },
              {
                id: 'revenueConfig',
                label: t('ui.revenue_config'),
                to: '/revenue-sharing/revenue-config',
                menuId: 'revenue_config',
              },
              {
                id: 'revenueRoundingSetting',
                label: t('ui.revenue_rounding_setting'),
                to: '/revenue-sharing/revenue-rounding-setting',
                menuId: 'revenue_rounding_setting',
              },
            ]}
          />

        </VStack>
      </Box>

      {/* FOOTER */}
      {!collapsed && (
        <Box px={4} py={3}>
          <Box fontSize="xs" fontWeight="medium" color="gray.600">
            {t('ui.powered_by')}{' '}
            <Link href="https://www.thitsaworks.com/" isExternal fontWeight="semibold" color="teal.600">
              ThitsaWorks
            </Link>
          </Box>
          <Box fontSize="2xs" fontWeight="normal" color="#999" mt="2px">
            v1.0.0
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default memo(SideBar);

