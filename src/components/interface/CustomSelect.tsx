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
  size?: 'sm' | 'md' | 'lg'; // Add size prop without default
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
    size, // No default value
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

  // Size-based styles - only applied when size is specified
  const getSizeStyles = (): Record<string, any> => {
    if (!size) return {};

    const sizeStyles: Record<string, any> = {
        sm: {
          control: {minHeight: '22px',fontSize: '12px',},
          valueContainer: {height: '22px',padding: '0 6px',},
          placeholder: {fontSize: '12px',},
          dropdownIndicator: {padding: '4px',},
          option: {fontSize: '12px',padding: '4px 8px',minHeight: '24px',},
          menuList: {fontSize: '12px',},
        },
      md: {
        control: {minHeight: '38px',fontSize: '14px',},
        valueContainer: {height: '36px',padding: '0 12px',},
        placeholder: {fontSize: '14px',},
        dropdownIndicator: {padding: '8px',},
        option: {fontSize: '14px',padding: '8px 12px',minHeight: '36px',},
        menuList: {fontSize: '14px',},
      },
      lg: {
        control: {minHeight: '48px',fontSize: '16px',},
        valueContainer: {height: '46px',padding: '0 12px',},
        placeholder: {fontSize: '16px',},
        dropdownIndicator: {padding: '10px',},
        option: {fontSize: '16px',padding: '10px 12px',minHeight: '44px',},
        menuList: {fontSize: '16px'},
      },
    };

    return sizeStyles[size] || {};
  };

  const sizeStyles = getSizeStyles();

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
          ...sizeStyles.menuList,
        }),
        placeholder: (base) => ({
          ...base,
          fontWeight: 400,
          pointerEvents: 'none',
          lineHeight: '1',
          ...sizeStyles.placeholder,
        }),
        valueContainer: (base) => ({
          ...base,
          ...sizeStyles.valueContainer,
        }),
        container: base => ({
          ...base,
          overflow: 'visible',
          width,
        }),
        control: (base) => ({
          ...base,
          ...sizeStyles.control,
        }),
        dropdownIndicator: (base) => ({
          ...base,
          ...sizeStyles.dropdownIndicator,
        }),
        option: (base) => ({
          ...base,
          ...sizeStyles.option,
        }),
      }}
    />
  );
};

export default CustomSelect;