import {
  Avatar,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  useToast,
  VStack,
  Box
} from '@chakra-ui/react';
import { getErrorMessage } from '@helpers/errors';
import { IApiErrorResponse } from '@typescript/services';
import { useAuth } from '@hooks/auth';
import { useGetProfile } from '@hooks/services';
import { useAppDispatch } from '@store';
import { UserActions } from '@store/features/user';
import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ITimezone } from 'react-timezone-select';
import { RootState } from '@store';
import { useSelector } from 'react-redux';
import { AppMode } from '@store/features/app';
import TimezoneSelect from '../TimezoneSelect';
import { isObject } from 'lodash';
import { MdLogout, MdLockOutline } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import LanguageDropdown from '@components/common/LanguageDropdown';

const Header = () => {
  const { t, i18n } = useTranslation();

  // Navigation
  const navigate = useNavigate();

  const toast = useToast();
  const { isAuth, logout } = useAuth();

  /* Redux */
  const dispatch = useAppDispatch();

  /* React Query */
  const { data } = useGetProfile({
    enabled: isAuth,
    onSuccess(data) {
      dispatch(UserActions.updateUser(data));
    },
    onError(err: IApiErrorResponse) {
      toast({
        position: 'top',
        description: getErrorMessage(err),
        status: 'error',
        isClosable: true,
        duration: 3000
      });
    }
  });

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezone>(
    (s) => s.app.selectedTimezone
  );

  const timezoneIana = useMemo(() => {
    if (isObject(selectedTimezone)) {
      return String((selectedTimezone as any).value || 'UTC');
    }
    return String(selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }, [selectedTimezone]);

  const handleTimezone = useCallback(
    (e: ITimezone) => {
      dispatch(AppMode.setTimezone(e));
      dispatch(AppMode.setOnBoarding());
    },
    [dispatch, selectedTimezone]
  );

  // Handler
  const handleChangePassword = useCallback(() => {
    navigate('change-password');
  }, [navigate]);


  const handleClick = (participantName: string, participantId: string) => {
      navigate(`/participant/position/${participantName}`, {
          state: { participantId },
      });
  };

  return (
    <HStack
      h={12}
      alignItems="center"
      spacing="3.5"
      px="4"
      py="3"
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(8px)"
      borderBottom="1px"
      borderColor="gray.100"
      position="fixed"
      left={0}
      right={0}
      top={0}
      zIndex={1}>
      {data != null ? (
        <VStack w={10} h={10} justifyContent="center" alignItems="center">
          <Box
            cursor='pointer'
            onClick={() => handleClick(data.participantName, data.participantId)     
          }>
          <Image
            alt={data.participantName}
            src={`data:${data.logoFileType};base64,${data.logo}`}
            fallback={
              <Text fontSize="xs" color="muted.400">
                {data.participantName}
              </Text>}
            objectFit="contain"
            width="8"
            height="8"
          />
          </Box>
        </VStack>
      ) : null}
      <Flex flex={2}>

      </Flex>
      {data != null ? (
        <HStack align="center">
          <Popover placement="bottom-start" closeOnBlur closeOnEsc isLazy>
            <PopoverTrigger>
              <Avatar
                size="sm"
                name={data.name}
                cursor="pointer"
                userSelect="none"
              />
            </PopoverTrigger>
            <Portal>
              <PopoverContent outline="none" minW={{ base: '300px', md: '340px' }}>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>
                  <HStack alignItems="center">
                    <Avatar size="md" name={data.name} />
                    <VStack align="flex-start" spacing={0}>
                      <Text
                        fontSize="md"
                        fontWeight="medium"
                        style={{ maxLines: 1 }}>
                        {data.name}
                      </Text>

                      <Text
                        fontSize="sm"
                        color="muted.500"
                        style={{ maxLines: 1 }}>
                        {data.email}
                      </Text>
                    </VStack>
                  </HStack>
                </PopoverHeader>
                <PopoverBody>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        {t('ui.language')}
                      </Text>
                      <LanguageDropdown size="xs" showCode={true} showName={false} />
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        {t('ui.timezone')}
                      </Text>
                      <TimezoneSelect
                        value={timezoneIana}
                        onChange={handleTimezone}
                        date={new Date()}
                      />
                    </Box>
                  </VStack>
                  <Button
                    variant="ghost"
                    colorScheme="muted"
                    w="100%"
                    justifyContent="flex-start"
                    leftIcon={<MdLockOutline size={18} />}
                    onClick={handleChangePassword}>
                    {t('ui.change_password')}
                  </Button>
                </PopoverBody>
                <PopoverFooter>
                  <Button
                    variant="ghost"
                    colorScheme="red"
                    w="100%"
                    justifyContent="flex-start"
                    leftIcon={<MdLogout size={18} />}
                    onClick={logout}>
                    {t('ui.logout')}
                  </Button>
                </PopoverFooter>
              </PopoverContent>
            </Portal>
          </Popover>
        </HStack>
      ) : null}
    </HStack>
  );
};

export default memo(Header);
