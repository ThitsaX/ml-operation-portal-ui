// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Text,
  VStack
} from '@chakra-ui/react';
import { FiSave } from 'react-icons/fi';
import StatusPill from './StatusPill';

interface WorkerIntervalCardProps {
  intervalMinutes: string;
  intervalError: string;
  isSaving: boolean;
  isSaveDisabled: boolean;
  isControlDisabled?: boolean;
  maxIntervalMinutes: number;
  onIntervalChange: (value: string) => void;
  onIntervalBlur: () => void;
  onSave: () => void;
}

const WorkerIntervalCard = ({
  intervalMinutes,
  intervalError,
  isSaving,
  isSaveDisabled,
  isControlDisabled = false,
  maxIntervalMinutes,
  onIntervalChange,
  onIntervalBlur,
  onSave
}: WorkerIntervalCardProps) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    rounded="lg"
    p={4}
    boxShadow="sm">
    <VStack align="stretch" spacing={4} w="full">
      <HStack justify="space-between" align="center" w="full">
        <Box>
          <Text
            fontSize="xl"
            fontWeight="bold"
            lineHeight="1.2"
            color="gray.800">
            Worker interval
          </Text>
          <Text color="gray.600" fontSize="sm" mt={1}>
            Configure how often the headless worker runs. Minimum is 1 minute.
          </Text>
        </Box>
        <StatusPill colorScheme="gray">Execution</StatusPill>
      </HStack>

      <FormControl isInvalid={Boolean(intervalError)}>
        <HStack
          justify="space-between"
          align="flex-start"
          spacing={4}
          w="full"
          p={4}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg">
          <Box>
            <Text fontSize="md" fontWeight="bold" color="gray.800">
              Interval minutes
            </Text>
            <Text color="gray.600" fontSize="sm" mt={2}>
              Choose the worker cadence. Use a value from 1 to{' '}
              {maxIntervalMinutes} minutes.
            </Text>
          </Box>
          <VStack align="flex-start" spacing={2} flexShrink={0}>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={maxIntervalMinutes}
              value={intervalMinutes}
              maxW="130px"
              h="52px"
              textAlign="center"
              isDisabled={isSaving || isControlDisabled}
              onBlur={onIntervalBlur}
              onChange={(event) => onIntervalChange(event.target.value)}
            />
            <StatusPill colorScheme="gray">1-{maxIntervalMinutes}m</StatusPill>
          </VStack>
        </HStack>
        <FormErrorMessage>{intervalError}</FormErrorMessage>
      </FormControl>

      <Box
        p={4}
        bg="teal.50"
        border="1px solid"
        borderColor="teal.100"
        rounded="lg">
        <Text fontSize="sm" color="teal.800" lineHeight="1.7">
          The worker reads this interval from configuration and runs
          independently. This page stays focused on scheme status and worker
          cadence only.
        </Text>
      </Box>

      <Button
        alignSelf="flex-start"
        leftIcon={<FiSave />}
        color="white"
        bg="primary"
        _hover={{ bg: 'primary', opacity: 0.4 }}
        onClick={(event) => {
          if (isSaveDisabled || isSaving || isControlDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onSave();
        }}
        isDisabled={isSaveDisabled || isSaving || isControlDisabled}
        isLoading={isSaving}>
        Save worker interval
      </Button>
    </VStack>
  </Box>
);

export default WorkerIntervalCard;
