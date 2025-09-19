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
import { getRequestErrorMessage } from '@helpers/errors';
import { useAuth } from '@hooks/auth';
import { useGetProfile } from '@hooks/services';
import { useAppDispatch } from '@store';
import { UserActions } from '@store/features/user';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ITimezone } from 'react-timezone-select';
import { RootState } from '@store';
import { useSelector } from 'react-redux';
import { AppMode } from '@store/features/app';
import TimezoneSelect from '../TimezoneSelect';
import { isObject } from 'lodash';

const Header = () => {
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
    onError(err) {
      console.log(err);
      console.log(JSON.stringify(err));
      toast({
        position: 'top',
        description: getRequestErrorMessage(err),
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
        </VStack>
      ) : null}
      <Flex flex={2}>
        <Heading
          size="md"
          textAlign="center"
          w="full"
          cursor="pointer"
          onClick={() => navigate('/company-informations')}>
          {data?.participantName || 'Operation Portal'}
        </Heading>
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
              <PopoverContent outline="none">
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
                  <Box mb={2}>
                    <TimezoneSelect
                      value={
                        isObject(selectedTimezone)
                          ? selectedTimezone.value
                          : selectedTimezone
                      }
                      onChange={handleTimezone}
                    />
                  </Box>
                  <Button
                    variant="ghost"
                    colorScheme="muted"
                    w="100%"
                    justifyContent="flex-start"
                    onClick={handleChangePassword}>
                    Change Password
                  </Button>
                </PopoverBody>
                <PopoverFooter>
                  <Button
                    variant="ghost"
                    colorScheme="red"
                    w="100%"
                    justifyContent="flex-start"
                    onClick={logout}>
                    Logout
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
