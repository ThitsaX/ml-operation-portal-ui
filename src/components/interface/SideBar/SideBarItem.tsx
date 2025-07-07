import { Link, type LinkProps } from '@chakra-ui/layout'
import { memo } from 'react'
import { NavLink as RouterLink } from 'react-router-dom'

export interface SideBarItemProps extends LinkProps {
  to: string
}

const SideBarItem = (props: SideBarItemProps) => {
  return (
    <Link
      as={RouterLink}
      {...props}
      px="4"
      py="2"
      rounded="lg"
      alignSelf="stretch"
      _hover={{ bgColor: 'muted.50' }}
      _activeLink={{ bgColor: 'primary', color: 'white' }}
    />
  )
}

export default memo(SideBarItem)
