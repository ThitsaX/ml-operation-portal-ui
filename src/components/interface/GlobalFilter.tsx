import React from 'react';
import { InputGroup, InputLeftElement, Input } from '@chakra-ui/react';
import { TbSearch } from 'react-icons/tb';

interface GlobalFilterProps {
  globalFilter: string | undefined;
  setGlobalFilter: (value: string | undefined) => void;
}

const GlobalFilter: React.FC<GlobalFilterProps> = ({
  globalFilter,
  setGlobalFilter,
}) => {
  return (
    <InputGroup w="250px">
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
  );
};

export default GlobalFilter;
