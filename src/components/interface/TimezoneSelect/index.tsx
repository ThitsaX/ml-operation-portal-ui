import { Select, SelectProps } from '@chakra-ui/react';
import {
  useTimezoneSelect,
  allTimezones,
  ITimezoneOption
} from 'react-timezone-select';
import { useState } from 'react';
import { defaultOption } from '@utils/constants';

export interface ITimezoneSelectProps extends Omit<SelectProps, 'onChange'> {
  onChange: (timezone: ITimezoneOption) => void;
}

const labelStyle = 'original';
const timezones = {
  ...allTimezones
  // other custom timezone goes here
};


const TimezoneSelect = ({ onChange, ...rest }: ITimezoneSelectProps) => {
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle,
    timezones,
  });

  // State to control default timezone
  const [removeDefault, setRemoveDefault] = useState(false)

  // Add the "Browser timezone" default option

  const updatedOptions = [defaultOption, ...options];

  return (
    <Select
      onChange={(e) => {
        setRemoveDefault(true)
        onChange(parseTimezone(e.currentTarget.value))
      }}
      {...rest}>
      {removeDefault ? (options.map((option) => (
        <option key={option.label} value={option.value}>
          {option.label}
        </option>
      ))) : (updatedOptions.map((option) => (
        <option hidden={option.label === defaultOption.label} key={option.label} value={option.value}>
          {option.label}
        </option>
      )))}
    </Select>
  );
};

export default TimezoneSelect;
