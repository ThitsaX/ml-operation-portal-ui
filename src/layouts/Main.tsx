import { Box, HStack, Stack } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Header, SideBar } from '@components/interface';
import { useGetUserState } from '@store/hooks';
import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { ResizeCallback } from 're-resizable';

const DEFAULT_WIDTH = 260;

function Main() {
  /* Router */
  const navigate = useNavigate();

  /* Redux */
  const user = useGetUserState();

  /* State */
  const [sideBarWidth, setSideBarWidth] = useState(DEFAULT_WIDTH);
  const deferredSideBarWidth = useDeferredValue(sideBarWidth);

  /* Handlers */
  const onResizeHandler = useCallback<ResizeCallback>(
    (_event, _direction, _elementRef, { width }) => {
      setSideBarWidth((prevWidth) => {
        if (prevWidth !== width) {
          return DEFAULT_WIDTH + width;
        }
        return prevWidth;
      });
    },
    []
  );

  useEffect(() => {
    if (user.auth == null) {
      navigate('/auth/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack pt="12" spacing={0} overflowY="scroll">
      <Header />
      <HStack>
        <Box w={deferredSideBarWidth}>
          <SideBar onResizeHandler={onResizeHandler} />
        </Box>

        <Box w={`calc(100vw - ${deferredSideBarWidth}px)`} alignSelf='flex-start'>
          <Outlet />
        </Box>
      </HStack>
    </Stack>
  );
}

export default Main;
