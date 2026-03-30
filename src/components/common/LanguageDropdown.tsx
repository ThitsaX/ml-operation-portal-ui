import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Text,
  type ButtonProps
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SupportedLanguages, type supportedLngs } from '@locales';
import { memo, useCallback } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';

// Language display codes
const LANGUAGE_CODES: Record<supportedLngs, string> = {
  en: 'EN',
  fr: 'FR'
};

interface LanguageDropdownProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  showCode?: boolean;
  showName?: boolean;
}

const LanguageDropdown = memo<LanguageDropdownProps>(({
  showCode = true,
  showName = false,
  size = 'xs',
  ...buttonProps
}) => {
  const { i18n } = useTranslation();

  const handleLanguageChange = useCallback((lang: supportedLngs) => {
    i18n.changeLanguage(lang);
  }, [i18n]);

  const currentLanguage = i18n.resolvedLanguage as supportedLngs;
  const currentCode = LANGUAGE_CODES[currentLanguage];
  const currentName = SupportedLanguages[currentLanguage];

  return (
    <Menu>
      <MenuButton
        as={Button}
        size={size}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        {...buttonProps}
      >
        <HStack spacing={1}>
          {showCode && <Text fontWeight="medium">{currentCode}</Text>}
          {showName && <Text>{currentName}</Text>}
        </HStack>
      </MenuButton>
      
      <MenuList minW="120px">
        {Object.entries(SupportedLanguages).map(([lang, name]) => {
          const languageKey = lang as supportedLngs;
          const code = LANGUAGE_CODES[languageKey];
          const isSelected = languageKey === currentLanguage;

          return (
            <MenuItem
              key={lang}
              onClick={() => handleLanguageChange(languageKey)}
              bg={isSelected ? 'gray.100' : 'transparent'}
              _hover={{
                bg: 'gray.50'
              }}
            >
              <HStack spacing={2} flex={1}>
                {showCode && (
                  <Text fontWeight="medium" fontSize="sm">
                    {code}
                  </Text>
                )}
                {showName && (
                  <Text fontSize="sm">{name}</Text>
                )}
              </HStack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
});

LanguageDropdown.displayName = 'LanguageDropdown';

export default LanguageDropdown;
