import React from 'react';
import Select, { MultiValue } from 'react-select';

export type OptionType = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: OptionType[];
  value: OptionType[];
  onChange: (selected: OptionType[]) => void;
  placeholder?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, value, onChange, placeholder }) => {
  const handleChange = (selected: MultiValue<OptionType>) => {
    onChange(selected as OptionType[]);
  };

  return (
    <Select
      isMulti
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder || 'Select...'}
    />
  );
};

export default MultiSelect;
