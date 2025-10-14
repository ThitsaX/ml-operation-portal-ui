import React from 'react';
import Select, { SingleValue, MultiValue } from 'react-select';

export type OptionType = {
  value: string;
  label: string;
};

interface BaseProps {
  options: OptionType[];
  placeholder?: string;
  maxMenuHeight?: number;
  width?: string | number;
  includeAllOption?: boolean;
  isClearable?: boolean;
}

interface SingleSelectProps extends BaseProps {
  isMulti?: false;
  value: OptionType | null;
  onChange: (selected: OptionType | null) => void;
}

interface MultiSelectProps extends BaseProps {
  isMulti: true;
  value: OptionType[];
  onChange: (selected: OptionType[]) => void;
}

type UnifiedSelectProps = SingleSelectProps | MultiSelectProps;

const CustomSelect: React.FC<UnifiedSelectProps> = (props) => {
  const {
    options,
    value,
    onChange,
    placeholder,
    maxMenuHeight = 200,
    isMulti = false,
    width = '100%',
    includeAllOption = false,
    isClearable = false,
  } = props;

  const finalOptions = includeAllOption
    ? [{ value: 'all', label: 'All' }, ...options]
    : options;

const handleChange = (
  selected: SingleValue<OptionType> | MultiValue<OptionType>
) => {
  if (props.isMulti) {
    props.onChange(selected as OptionType[]);
  } else {
    props.onChange(selected as OptionType | null);
  }
};

  return (
    <Select
      isMulti={isMulti}
      options={finalOptions}
      value={value}
      onChange={handleChange}
      placeholder={placeholder || 'Select...'}
      isClearable={isClearable}
      closeMenuOnScroll={false}
      menuShouldBlockScroll={true}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menuList: base => ({
          ...base,
          maxHeight: maxMenuHeight,
          overflowY: 'auto',
        }),
        container: base => ({
          ...base,
          overflow: 'visible',
          width,
        }),
      }}
    />
  );
};

export default CustomSelect;
