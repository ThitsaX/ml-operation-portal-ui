import React from 'react';
import { InputGroup, InputLeftElement, Input, Box } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';

interface GlobalFilterProps {
  globalFilter: string | undefined;
  setGlobalFilter: (value: string | undefined) => void;
  mt?: string | number;
  ml?: string | number;
}

const GlobalFilter: React.FC<GlobalFilterProps> = ({
  globalFilter,
  setGlobalFilter,
  mt = 0,
  ml = 0,
}) => {
  return (
    <Box mt={mt} ml={ml} w="250px">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <TbSearch color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search..."
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value || undefined)}
          variant="flushed"
          focusBorderColor="blue.400"
        />
      </InputGroup>
    </Box>
  );
};

export default GlobalFilter;
