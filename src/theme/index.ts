import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    heading: '\'DM Sans\', sans-serif',
    body: '\'DM Sans\', sans-serif'
  },
  fontSizes: {
    '2xs': '10px',
    'xs': '12px',
    'sm': '14px',
    'md': '16px',
    'lg': '18px',
    'xl': '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,    
    extrabold: 800,
  },
  colors: {
    primary: '#7161EF',
    secondary: '#2D3142',
    background: '#FFFFFF',
    brand: {
      50: '#e5e4ff',
      100: '#b2b3ff',
      200: '#8080ff',
      300: '#4f4dfe',
      400: '#201bfd',
      500: '#0b02e4',
      600: '#0401b2',
      700: '#010080',
      800: '#00004f',
      900: '#00001f'
    },
    canary: {
      50: '#ffffdd',
      100: '#fffeb0',
      200: '#fffd80',
      300: '#fffc4f',
      400: '#fffb23',
      500: '#e6e110',
      600: '#b3af06',
      700: '#807d00',
      800: '#4d4b00',
      900: '#1b1900'
    },
    lightCoral: {
      50: '#ffe2e4',
      100: '#ffb2b3',
      200: '#ff8082',
      300: '#fe4e51',
      400: '#fe1f20',
      500: '#e50a08',
      600: '#b20305',
      700: '#800003',
      800: '#4e0000',
      900: '#1f0000'
    },
    muted: {
      50: '#eef1fd',
      100: '#d1d4e3',
      200: '#b3b8cb',
      300: '#959bb6',
      400: '#787fa0',
      500: '#5e6586',
      600: '#484f69',
      700: '#34384c',
      800: '#1e222f',
      900: '#070b16'
    },
    magnolia: {
      50: '#f3eef6',
      100: '#d8cde2',
      200: '#bfaccf',
      300: '#a68abd',
      400: '#8e69ac',
      500: '#744f92',
      600: '#5a3d71',
      700: '#402c50',
      800: '#261a30',
      900: '#0d0811'
    },
    trueGray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717'
    }
  }
})

export default theme
