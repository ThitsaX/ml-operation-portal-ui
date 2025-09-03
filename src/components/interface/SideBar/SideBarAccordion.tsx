import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  type AccordionProps,
} from '@chakra-ui/accordion';
import { Box, VStack, HStack, Text } from '@chakra-ui/layout';
import React, { memo } from 'react';
import SideBarItem, { type SideBarItemProps } from './SideBarItem';
import { useGetUserState } from '@store/hooks';
import { menuIds } from '../../../configs/menu-ids';
import { useState, useEffect } from 'react';
import { store } from '../../../store';
import { useSelector } from 'react-redux';
import { RootState } from "../../../store";

export interface SideBarAccordionProps extends AccordionProps {
  items: SideBarItemProps[];
  label: string;
  icon: React.ReactNode;
  menuId: string;
}

const SideBarAccordion = ({
  label,
  icon,
  menuId,
  items,
  ...props
}: SideBarAccordionProps) => {

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

        <Accordion defaultIndex={[]} allowToggle alignSelf="stretch" {...props}>
          <AccordionItem borderTopWidth={0} borderBottomWidth="0px !important">
            <AccordionButton rounded="lg" _hover={{ bg: 'muted.50' }}>
              <Box as="span" flex="1" textAlign="left">
                <HStack spacing={2}>
                  {icon && <>{icon}</>}
                  <Text>{label}</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>

            <AccordionPanel pr={0} pb={2}>
              <VStack align="stretch">
                {items?.map((item) => (
                  <SideBarItem
                    key={item.id || item.label} // Use unique property like `id` or `label`
                    {...item}
                  />
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
};

export default memo(SideBarAccordion);
