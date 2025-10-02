import { memo, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HStack, Text, Tooltip, Box, Link } from '@chakra-ui/react';
import { useGetUserState } from '@store/hooks';
import { menuIds } from '../../../configs/menu-ids';

export interface SideBarItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  to: string;
  menuId: string;
  collapsed?: boolean;
}

const SideBarItem = (props: SideBarItemProps) => {
  const { label, icon, menuId, collapsed = false, to } = props;
  const { data } = useGetUserState();
  const [menuList, setMenuList] = useState<number[]>([]);

  useEffect(() => {
    if (data?.accessMenuList) {
      setMenuList(data.accessMenuList);
    }
  }, [data]);

  const checkMenuIds = () => {
    const id = menuIds[menuId];
    return menuList?.includes(id);
  };

  if (!checkMenuIds()) return null;

  return (
    <Tooltip label={collapsed ? label : ''} placement="right" hasArrow>
      <Link
        as={NavLink}
        to={to}
        display="inline-flex"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-start'}
        marginRight={4}
        px={collapsed ? 2 : 4}
        mr={4}
        py="2"
        w="100%"
        borderRadius="md"
        textDecoration="none"
        color="gray.600"
        rounded="lg"
        alignSelf="stretch"
        _hover={{ bgColor: 'muted.50' }}
        _activeLink={{ bgColor: 'primary', color: 'white' }}
      >
        <HStack spacing={collapsed ? 0 : 2}>
          {icon && <Box>{icon}</Box>}
          {!collapsed && <Text color="gray.800">{label}</Text>}
        </HStack>
      </Link>
    </Tooltip>
  );
};

export default memo(SideBarItem);
