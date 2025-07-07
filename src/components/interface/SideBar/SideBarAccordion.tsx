import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  type AccordionProps
} from '@chakra-ui/accordion'
import { Box, VStack } from '@chakra-ui/layout'
import React, { memo } from 'react'
import SideBarItem, { type SideBarItemProps } from './SideBarItem'

export interface SideBarAccordionProps extends AccordionProps {
  items: SideBarItemProps[]
  children: string
}

const SideBarAccordion = ({
  children,
  items,
  ...props
}: SideBarAccordionProps) => {
  return (
    <Accordion defaultIndex={0} allowToggle alignSelf="stretch" {...props}>
      <AccordionItem borderTopWidth={0} borderBottomWidth="0px !important">
        <AccordionButton rounded="lg" _hover={{ bg: 'muted.50' }}>
          <Box as="span" flex="1" textAlign="left">
            {children}
          </Box>
          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel pr={0} pb={2}>
          <VStack>
            {items?.map((item, index) => {
              return (
                <SideBarItem
                  key={`sidebar-accordion-item-${index}`}
                  {...item}
                />
              )
            })}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

export default memo(SideBarAccordion)
