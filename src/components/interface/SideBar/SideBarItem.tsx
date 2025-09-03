import { memo, useEffect, useState } from 'react'
import { NavLink as RouterLink } from 'react-router-dom'
import { Link, type LinkProps, HStack, Text } from '@chakra-ui/react'
import { useGetUserState } from '@store/hooks';
import { menuIds } from '../../../configs/menu-ids';

export interface SideBarItemProps extends LinkProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  to: string;
  menuId: string;
}

const SideBarItem = (props: SideBarItemProps) => {
  const { label, icon, menuId, ...rest } = props;
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

  return (
    <>
      {checkMenuIds() && (
        <Link
          as={RouterLink}
          {...rest}
          px="4"
          py="2"
          rounded="lg"
          alignSelf="stretch"
          _hover={{ bgColor: 'muted.50' }}
          _activeLink={{ bgColor: 'primary', color: 'white' }}
        >
          <HStack spacing={2}>
            {icon && <>{icon}</>}
            <Text>{label}</Text>
          </HStack>
        </Link>
      )}
    </>
  );
}

export default memo(SideBarItem)
