import { memo } from 'react';
import { HStack, Link, Stack, VStack, Text } from '@chakra-ui/react';
import { Resizable, type ResizeCallback } from 're-resizable';
import SideBarAccordion from './SideBarAccordion';
import SideBarItem from './SideBarItem';
import { useToken } from '@chakra-ui/react';
import { useGetUserState } from '@store/hooks';
import { FiHome, FiRepeat, FiBarChart2, FiHelpCircle } from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { AiOutlineAudit } from "react-icons/ai";
import { MdPendingActions } from "react-icons/md";
import { FaHandshake } from "react-icons/fa";
import { IoPeopleCircle } from "react-icons/io5";
import { menuIds } from '../../../configs/menu-ids';


const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 260;
const MAX_WIDTH = 360;

const SideBar = ({ onResizeHandler }: { onResizeHandler: ResizeCallback }) => {
  const space12 = useToken('space', '12');



  /* Redux */
  // const { data } = useGetUserState();

  return (
    <HStack spacing={0}>
      <Resizable
        defaultSize={{
          width: DEFAULT_WIDTH,
          height: '100%'
        }}
        minWidth={MIN_WIDTH}
        maxWidth={MAX_WIDTH}
        enable={{ right: true }}
        onResize={onResizeHandler}
        style={{
          position: 'fixed',
          top: space12,
          left: 0,
          bottom: 0,
          zIndex: 1
        }}>
        <VStack
          h="calc(100% - 45px)"
          px="4"
          py="3"
          bg="rgba(255, 255, 255, 0.8)"
          backdropFilter="blur(8px)"
          borderRight="1px"
          borderColor="gray.100"
          align="flex-start"
          justify="space-between"
          overflowY="scroll">
          <VStack spacing="2" w={'100%'}>
            <VStack
              border="1px"
              borderColor="teal.700"
              borderRadius="md"
              px={3}
              py={2}
              mb={1}
              w="full"
              spacing={0}
              bg="white"
            >
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="teal.700"
                letterSpacing="widest"
                textTransform="uppercase"
                w="full"
                textAlign="center"
              >
                Operational
              </Text>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="teal.700"
                letterSpacing="widest"
                textTransform="uppercase"
                w="full"
                textAlign="center"
              >
                Portal
              </Text>
            </VStack>

            <SideBarItem to="/home" id="1" icon={<FiHome />} label="Home" menuId="home" />

            <SideBarAccordion icon={<HiOutlineBuildingLibrary />} label="Participant"
              menuId="participant_positions"
              items={[
                { id: 'position', label: 'Participant Positions', to: '/participant/position', menuId: "participant_positions" },
                { id: 'list', label: 'Participant List', to: '/participant/list', menuId: "participant_positions" },
              ]}
            />

            <SideBarAccordion icon={<IoPeopleCircle />} label="User Management"
              menuId="participant_positions"
              items={[
                { id: 'user', label: 'User', to: '/user-management/user', menuId: "participant_positions" },
              ]}
            />

            <SideBarItem to="/transfers" id="3" icon={<FiRepeat />} label="Transfers"
              menuId="transfers"
            />

            <SideBarAccordion icon={<FaHandshake />} label="Settlement"
              menuId="settlement"
              items={[
                { id: 'settlementModels', label: 'Settlement Models', to: 'settlement/settlement-models', menuId: "settlement_models" },
                { id: 'settlementWindows', label: 'Settlement Windows', to: 'settlement/settlement-windows', menuId: "settlement_windows" },
                { id: 'finalizeSettlement', label: 'Finalize Settlements', to: 'settlement/finalize-settlement', menuId: "finalize_settlement" },
              ]}
            />

            <SideBarAccordion icon={<FiBarChart2 />} label="Reports"
              menuId="reports"
              items={[
                { id: 'settlementBankReport', label: 'Settlement Bank Report', to: 'reports/settlement-bank-report', menuId: "settlement_bank_report" },
                { id: 'settlementDetailReport', label: 'Settlement Detail Report', to: 'reports/settlement-detail-report', menuId: "settlement_detail_report" },
                { id: 'settlementSummary', label: 'Settlement Summary Report', to: 'reports/settlement-summary-report', menuId: "settlement_summary_report" },
                { id: 'settlementStatementReport', label: 'Settlement Statement Report', to: 'reports/settlement-statement-report', menuId: "settlement_statement_report" },
                { id: 'settlementAuditReport', label: 'Settlement Audit Report', to: 'reports/settlement-audit-report', menuId: "settlement_audit_report" },
                { id: 'auditReport', label: 'Audit Report', to: 'reports/audit-report', menuId: "audit_report" },
              ]}
            />

            <SideBarItem to="/pending-approvals" id="5" icon={<MdPendingActions />} label="Pending Approvals"
              menuId="pending_approvals"
            />

            <SideBarItem to="/audit" id="6" icon={<AiOutlineAudit />} label="Audit"
              menuId="audit" />

            <SideBarItem to="/support-center" id="7" icon={<FiHelpCircle />} label="Support Center"
              menuId="support_center"
            />

            {/* <SideBarItem to="/dashboard">Dashboard</SideBarItem> */}
            {/* {data?.userRoleType === 'OPERATION' ? (
              <>
                <SideBarAccordion items={reportItems}>Reports</SideBarAccordion>
              </>
            ) : null}
            <SideBarItem to="/audit">Audit</SideBarItem>
            {data?.userRoleType === 'OPERATION' ? (
              <SideBarItem to="/transfer">Transfer</SideBarItem>
            ) : null}

            {data?.userRoleType === 'ADMIN' ? (
              <SideBarAccordion items={userItems}>Users</SideBarAccordion>
            ) : null} */}
          </VStack>
          <Stack spacing="4" pt="2" pl="4" pb="5">
            {/* <Link
              href="https://thitsa.atlassian.net/wiki/spaces/WynePay/pages/2658140172/DFSP+Portal"
              isExternal>
              About
            </Link>
            <Link
              href="https://thitsa.atlassian.net/servicedesk/customer/user/login?destination=portals/"
              isExternal>
              Help
            </Link> */}
            {/* <Link href="mailto:support@wynepay.com">Contact Informations</Link> */}
            <span style={{ fontSize: '0.9em', color: '#666' }}>
              Powered by{' '}
              <Link
                href="https://www.thitsaworks.com/"
                isExternal
                color="blue.800"
                fontWeight="bold"
                _hover={{ color: 'blue.900' }}
              >
                ThitsaWorks
              </Link>
            </span>
            <span style={{ fontSize: '0.8em', color: '#999', display: 'block', marginTop: '2px' }}>
              version1
            </span>
          </Stack>
        </VStack>
      </Resizable>
    </HStack>
  );
};

export default memo(SideBar);
