import { memo } from 'react';
import { HStack, Link, Stack, VStack } from '@chakra-ui/layout';
import { Resizable, type ResizeCallback } from 're-resizable';
import SideBarAccordion from './SideBarAccordion';
import SideBarItem, { type SideBarItemProps } from './SideBarItem';
import { useToken } from '@chakra-ui/react';
import { useGetUserState } from '@store/hooks';

const reportItems: SideBarItemProps[] = [
  {
    to: '/reports/settlement',
    children: 'DFSP Settlement Report'
  },
  {
    to: '/reports/settlement-details',
    children: 'DFSP Settlement Details Report'
  },
  {
    to: '/reports/settlement-statement',
    children: 'DFSP Settlement Statement Report'
  },
  {
    to: '/reports/transactions-fee-settlement',
    children: 'DFSP Transactions for Fee Settlement'
  }
];

const userItems: SideBarItemProps[] = [
  {
    to: '/users/all',
    children: 'Users'
  },
  {
    to: '/users/create',
    children: 'Create User'
  }
];

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 260;
const MAX_WIDTH = 360;

const SideBar = ({ onResizeHandler }: { onResizeHandler: ResizeCallback }) => {
  const space12 = useToken('space', '12');

  /* Redux */
  const { data } = useGetUserState();

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
            <SideBarItem to="/dashboard">Dashboard</SideBarItem>
            {data?.user_role_type === 'OPERATION' ? (
              <>
                <SideBarAccordion items={reportItems}>Reports</SideBarAccordion>
              </>
            ) : null}
            <SideBarItem to="/audit">Audit</SideBarItem>
            {data?.user_role_type === 'OPERATION' ? (
              <SideBarItem to="/transfer">Transfer</SideBarItem>
            ) : null}

            {data?.user_role_type === 'ADMIN' ? (
              <SideBarAccordion items={userItems}>Users</SideBarAccordion>
            ) : null}
          </VStack>
          <Stack spacing="4" pt="2" pl="4" pb="5">
            <Link
              href="https://thitsa.atlassian.net/wiki/spaces/WynePay/pages/2658140172/DFSP+Portal"
              isExternal>
              About
            </Link>
            <Link
              href="https://thitsa.atlassian.net/servicedesk/customer/user/login?destination=portals/"
              isExternal>
              Help
            </Link>
            <Link href="mailto:support@wynepay.com">Contact Informations</Link>
          </Stack>
        </VStack>
      </Resizable>
    </HStack>
  );
};

export default memo(SideBar);
