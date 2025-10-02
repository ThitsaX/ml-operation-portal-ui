import { Box } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header, SideBar } from '@components/interface';
import { useGetUserState } from '@store/hooks';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';

const DEFAULT_WIDTH = 260;
const COLLAPSED_WIDTH = 64;
const HEADER_HEIGHT = '64px';

function Main() {
  const navigate = useNavigate();
  const user = useGetUserState();

  const [sideBarWidth, setSideBarWidth] = useState<number>(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const deferredSideBarWidth = useDeferredValue<number>(sideBarWidth);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      setSideBarWidth(next ? COLLAPSED_WIDTH : DEFAULT_WIDTH);
      return next;
    });
  }, []);

  useEffect(() => {
    if (user.auth == null) navigate('/auth/login', { replace: true });
  }, [user.auth, navigate]);

  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      {/* Header stays in normal flow */}
      <Box flex="none">
        <Header />
      </Box>

      {/* Sidebar + Main */}
      <Box display="flex" flex="1" overflow="hidden">
        {/* Sidebar */}
        <Box w={`${Number(deferredSideBarWidth)}px`} flex="none">
          <SideBar
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            width={sideBarWidth}
            headerHeight={HEADER_HEIGHT}
          />
        </Box>

        {/* Main content */}
        <Box flex="1" p="4" overflowY="auto">
          <Outlet />
        </Box>
      </Box>
    </Box>

  );
}

export default Main;
