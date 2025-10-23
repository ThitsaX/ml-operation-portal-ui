import { SelectProps } from '@chakra-ui/react';
import {
  useTimezoneSelect,
  allTimezones,
  ITimezoneOption
} from 'react-timezone-select';
import { useState } from 'react';
import { defaultOption } from '@utils/constants';
import { CustomSelect } from '@components/interface';

export interface ITimezoneSelectProps extends Omit<SelectProps, 'onChange'> {
  onChange: (timezone: ITimezoneOption) => void;
  value?: string; // Accept timezone string as value
}

const labelStyle = 'original';
const timezones = {
  ...allTimezones
  // other custom timezone goes here
};

const TimezoneSelect = ({ onChange, value, ...rest }: ITimezoneSelectProps) => {
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle,
    timezones,
  });

  // State to control default timezone
  const [removeDefault, setRemoveDefault] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState(value || null);

  // Add the "Browser timezone" default option

  const updatedOptions = [defaultOption, ...options];

  return (
    <CustomSelect
      isMulti={false}
      placeholder="Select Timezone"
      options={
          removeDefault? options.map(option => ({
              value: option.value,
              label: option.label,
            }))
          :updatedOptions.map(option => ({
            ...option,
            hidden: option.label === defaultOption.label
      }))}
      value={selectedTimezone ? options.find(opt => opt.value === selectedTimezone) || null : null}
     onChange={(selected) => {
        setRemoveDefault(true);
        setSelectedTimezone(selected?.value || null);
        onChange(parseTimezone(selected?.value || ''));
      }}
    />
  );
};

export default TimezoneSelect;