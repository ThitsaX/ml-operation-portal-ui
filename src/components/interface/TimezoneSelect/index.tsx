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
  ...allTimezones,
  [defaultOption.value]: defaultOption.altName
  // other custom timezone goes here
};

const TimezoneSelect = ({ onChange, value, ...rest }: ITimezoneSelectProps) => {
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle,
    timezones,
  });

  const timezoneOptions = [defaultOption, ...options];

  // State to control default timezone
  const [removeDefault, setRemoveDefault] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState(value || null);

  // Add the "Browser timezone" default option


  return (
    <CustomSelect
      isMulti={false}
      placeholder="Select Timezone"
      options={timezoneOptions}
      value={selectedTimezone ? timezoneOptions.find(opt => opt.value === selectedTimezone) || null : null}
      onChange={(selected) => {
        setSelectedTimezone(selected?.value || null);
        if (selected?.value === defaultOption.value) {
          onChange(defaultOption);
        } else {
          const parsed = parseTimezone(selected?.value || '');
          if (parsed) {
            onChange(parsed);
          } else {
            onChange(defaultOption);
          }
        }

      }}
    />
  );
};

export default TimezoneSelect;