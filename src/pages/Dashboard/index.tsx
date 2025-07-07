import {
  Heading,
  HStack,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Tr,
  VStack,
  Tooltip,
} from '@chakra-ui/react';
import { useGetDashboard } from '@hooks/services';
import { thousandSeparator } from '@utils';
import moment from 'moment';
import { memo, useCallback, useEffect, useState } from 'react';
import { IoReload } from 'react-icons/io5';
import type { ITimezoneOption } from 'react-timezone-select';
import { useSelector } from 'react-redux';
import { RootState } from '@store';

const Dashboard = () => {
  /* React Query */
  const { data } = useGetDashboard();

  // Redux
  const selectedTimezone = useSelector<RootState, ITimezoneOption>(
    (s) => s.app.selectedTimezone
  );

  // Date time string for latest update
  const stringTimezone = selectedTimezone.value;

  //Changing date time according to the timezone
  const handleTimeZone = useCallback((value: string) => {
    return moment
      .tz(value)
      .format('DD/MM/YYYY hh:mm:ss A')
  }, [stringTimezone])

  const [stringDateTime, setStringDateTime] = useState<String>(handleTimeZone(stringTimezone))

  useEffect(() => {
    setStringDateTime(handleTimeZone(stringTimezone))
  }, [selectedTimezone, stringTimezone])

  return (
    <VStack align="flex-start" w="full" h="full" p="3" spacing={4}>
      <VStack align="flex-start">
        <Heading fontSize="3xl">Financial Positions</Heading>
        <HStack align="center">
          <Tooltip label='Refresh' bg='white' color='black'>
            <IconButton
              colorScheme="muted"
              variant="ghost"
              aria-label="Edit Account"
              icon={<IoReload />}
              onClick={() => {
                setStringDateTime(() => handleTimeZone(stringTimezone))
              }}
            />
          </Tooltip>

          <Text fontSize="sm" color="muted.700">
            Last Updated at {`${stringDateTime} ${selectedTimezone.label}`}
          </Text>
        </HStack>
      </VStack>
      <TableContainer
        w="full"
        borderWidth={1}
        borderBottom={0}
        borderColor="gray.100"
        rounded="lg">
        <Table variant="simple">
          <Tbody>
            <Tr>
              <Th>DFSP</Th>
              <Td>{data?.financial_data.dfsp_name}</Td>
            </Tr>
            <Tr>
              <Th>Currency</Th>
              <Td>{data?.financial_data.currency}</Td>
            </Tr>
            <Tr>
              <Th>Balance</Th>
              <Td>
                {thousandSeparator({
                  value: data?.financial_data.balance || 0
                })}
              </Td>
            </Tr>
            <Tr>
              <Th>Current Position</Th>
              <Td>
                {thousandSeparator({
                  value: data?.financial_data.current_position || 0
                })}
              </Td>
            </Tr>
            <Tr>
              <Th>NDC</Th>
              <Td>
                {thousandSeparator({ value: data?.financial_data.ndc || 0 })}
              </Td>
            </Tr>
            <Tr>
              <Th>NDC used %</Th>
              <Td>{data?.financial_data.ndc_used}%</Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
};

export default memo(Dashboard);
