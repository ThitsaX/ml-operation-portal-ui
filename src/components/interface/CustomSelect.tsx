import React from 'react';
import Select, { SingleValue, MultiValue, MenuPlacement } from 'react-select';

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
  isDisabled?: boolean;
  menuPlacement?: MenuPlacement; // 'auto' | 'top' | 'bottom'
  menuPortalTarget?: boolean;
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
    isDisabled = false,
    menuPlacement = 'auto',
    menuPortalTarget = false, 
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
      isDisabled={isDisabled} 
      menuPlacement={menuPlacement}
      menuPortalTarget={menuPortalTarget ? document.body : undefined} 
      closeMenuOnScroll={false}
      menuShouldBlockScroll={true}
      styles={{
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        menuList: base => ({
          ...base,
          maxHeight: maxMenuHeight,
          overflowY: 'auto',
        }),
        placeholder: (base) => ({
          ...base,
          fontSize: '0.875rem',
          fontWeight: 400,
          pointerEvents: 'none',
          lineHeight: '1',
        }),
        valueContainer: (base) => ({
        ...base,
        height: '38px', // Slightly less than control height
        padding: '0 12px',
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
