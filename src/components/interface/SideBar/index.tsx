import { memo } from 'react';
import { Box, IconButton, Link, VStack } from '@chakra-ui/react';
import SideBarAccordion from './SideBarAccordion';
import SideBarItem from './SideBarItem';
import { FiHome, FiRepeat, FiBarChart2, FiHelpCircle, FiMenu } from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { AiOutlineAudit } from 'react-icons/ai';
import { MdPendingActions } from 'react-icons/md';
import { FaHandshake } from 'react-icons/fa';
import { IoPeopleCircle } from 'react-icons/io5';

const DEFAULT_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

interface SideBarProps {
  collapsed: boolean;
  toggleCollapse: () => void;
  width: number; // px
  headerHeight: string; // e.g. '64px'
}

const SideBar = ({ collapsed, toggleCollapse, width = DEFAULT_WIDTH, headerHeight }: SideBarProps) => {
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
              Operational Portal
            </Box>
          </Box>
        )}

        <IconButton
          aria-label="Toggle sidebar"
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
            label="Home"
            collapsed={collapsed}
            menuId="home"
          />

          <SideBarAccordion
            icon={<HiOutlineBuildingLibrary />}
            label="Participant"
            collapsed={collapsed}
            menuId="participants"
            items={[
              {
                id: 'position',
                label: 'Participant Positions',
                to: '/participant/position',
                menuId: 'participant_positions',
              },
            ]}
          />

          <SideBarAccordion
            icon={<IoPeopleCircle />}
            label="User Management"
            collapsed={collapsed}
            menuId="user_management"
            items={[
              {
                id: 'user',
                label: 'User',
                to: '/user-management/user',
                menuId: 'users',
              },
            ]}
          />

          <SideBarItem
            to="/transfers"
            id="3"
            icon={<FiRepeat />}
            label="Transfers"
            collapsed={collapsed}
            menuId="transfers"
          />

          <SideBarAccordion
            icon={<FaHandshake />}
            label="Settlement"
            collapsed={collapsed}
            menuId="settlement"
            items={[
              {
                id: 'settlementModels',
                label: 'Settlement Models',
                to: 'settlement/settlement-models',
                menuId: 'settlement_models',
              },
              {
                id: 'settlementWindows',
                label: 'Settlement Windows',
                to: 'settlement/settlement-windows',
                menuId: 'settlement_windows',
              },
              {
                id: 'finalizeSettlement',
                label: 'Finalize Settlements',
                to: 'settlement/finalize-settlement',
                menuId: 'finalize_settlement',
              },
            ]}
          />

          <SideBarAccordion
            icon={<FiBarChart2 />}
            label="Reports"
            collapsed={collapsed}
            menuId="reports"
            items={[
              {
                id: 'settlementBankReport',
                label: 'Settlement Bank Report',
                to: 'reports/settlement-bank-report',
                menuId: 'settlement_bank_report',
              },
              {
                id: 'settlementDetailReport',
                label: 'Settlement Detail Report',
                to: 'reports/settlement-detail-report',
                menuId: 'settlement_detail_report',
              },
              {
                id: 'settlementSummary',
                label: 'Settlement Summary Report',
                to: 'reports/settlement-summary-report',
                menuId: 'settlement_summary_report',
              },
              {
                id: 'settlementStatementReport',
                label: 'Settlement Statement Report',
                to: 'reports/settlement-statement-report',
                menuId: 'settlement_statement_report',
              },
              {
                id: 'settlementAuditReport',
                label: 'Settlement Audit Report',
                to: 'reports/settlement-audit-report',
                menuId: 'settlement_audit_report',
              },
              {
                id: 'auditReport',
                label: 'Audit Report',
                to: 'reports/audit-report',
                menuId: 'audit_report',
              },
              {
                id: 'transactionDetailReport',
                label: 'Transaction Detail Report',
                to: 'reports/transaction-detail-report',
                menuId: 'transaction_detail_report',
              },
              {
                id: 'ManagementSummaryReport',
                label: 'Management Summary Report',
                to: 'reports/management-summary-report',
                menuId: 'management_summary_report',
              },
            ]}
          />

          <SideBarItem
            to="/pending-approvals"
            id="5"
            icon={<MdPendingActions />}
            label="Pending Approvals"
            collapsed={collapsed}
            menuId="pending_approvals"
          />

          <SideBarItem
            to="/audit"
            id="6"
            icon={<AiOutlineAudit />}
            label="Audit"
            collapsed={collapsed}
            menuId="audit"
          />

          <SideBarItem
            to="/support-center"
            id="7"
            icon={<FiHelpCircle />}
            label="Support Center"
            collapsed={collapsed}
            menuId="support_center"
          />
        </VStack>
      </Box>

      {/* FOOTER */}
      {!collapsed && (
        <Box px={4} py={3}>
          <Box fontSize="xs" fontWeight="medium" color="gray.600">
            Powered by{' '}
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
