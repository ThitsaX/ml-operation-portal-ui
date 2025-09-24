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
  maxMenuHeight?: number; // optional
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  maxMenuHeight = 200,
}) => {
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
      closeMenuOnScroll={false}
      menuShouldBlockScroll={true}
      menuPortalTarget={document.body}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menuList: base => ({
          ...base,
          maxHeight: maxMenuHeight,
          overflowY: 'auto',
        }),
        container: base => ({ ...base, overflow: 'visible' }),
      }}
    />

  );
};

export default MultiSelect;
