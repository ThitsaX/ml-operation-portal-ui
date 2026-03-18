import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  type AccordionProps,
} from '@chakra-ui/accordion';
import { Box, VStack, HStack, Text, Tooltip } from '@chakra-ui/react';
import React, { memo, useEffect, useState } from 'react';
import SideBarItem, { type SideBarItemProps } from './SideBarItem';
import { useGetUserState } from '@store/hooks';
import { menuIds } from '../../../configs/menu-ids';
import { useNavigate } from 'react-router-dom';

export interface SideBarAccordionProps extends AccordionProps {
  items: SideBarItemProps[];
  label: string;
  icon: React.ReactNode;
  menuId: string;
  collapsed?: boolean;
}

const SideBarAccordion = ({
  label,
  icon,
  menuId,
  items,
  collapsed = false,
  ...props
}: SideBarAccordionProps) => {
  const { data } = useGetUserState();
  const [menuList, setMenuList] = useState<number[]>([]);
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (data?.accessMenuList) {
      setMenuList(data.accessMenuList);
      setAccordionIndex(null);
    }
  }, [data]);

  const checkMenuIds = () => {
    const id = menuIds[menuId];
    return menuList?.includes(id);
  };

  const isItemAllowed = (item: SideBarItemProps) => {
    const id = menuIds[item.menuId];
    return typeof id === 'number' && menuList?.includes(id);
  };

  const handleClick = () => {
    if (!collapsed) return;
    const firstAllowedItem = items.find(isItemAllowed);
    if (firstAllowedItem) navigate(firstAllowedItem.to);
  };

  const handleAccordionChange = (index: number | number[] | undefined) => {
    if (collapsed) return;
    if (typeof index === 'number') {
      setAccordionIndex(accordionIndex === index ? null : index);
    } else {
      setAccordionIndex(null);
    }
  };


  return (
    <>
      {checkMenuIds() && (
        <Accordion
          index={accordionIndex ?? undefined}
          onChange={handleAccordionChange}
          allowToggle
          alignSelf="stretch"
          {...props}
        >
          <AccordionItem borderTopWidth={0} borderBottomWidth="0px !important">
            <Tooltip label={collapsed ? label : ''} placement="right" hasArrow>
              <AccordionButton 
                rounded="lg" 
                fontWeight="medium"
                transition="all 0.15s ease"
                _hover={{ 
                  bg: 'gray.100',
                  color: 'gray.900'
                }} 
                onClick={handleClick}
              >
                <Box as="span" flex="1" textAlign="left">
                  <HStack spacing={collapsed ? 0 : 2} justify={collapsed ? "center" : "flex-start"}>
                    {icon && <Box fontSize="lg">{icon}</Box>}
                    {!collapsed && <Text fontSize="sm">{label}</Text>}
                  </HStack>
                </Box>
                {!collapsed && <AccordionIcon />}
              </AccordionButton>
            </Tooltip>

            {!collapsed && (
              <AccordionPanel pr={0} pb={2}>
                <VStack align="stretch">
                  {items?.map((item) => (
                    <SideBarItem
                      key={item.id || item.label}
                      {...item}
                      collapsed={collapsed}
                    />
                  ))}
                </VStack>
              </AccordionPanel>
            )}
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
};

export default memo(SideBarAccordion);
