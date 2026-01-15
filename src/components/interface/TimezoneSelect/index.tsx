import { SelectProps } from '@chakra-ui/react';
import {
  useTimezoneSelect,
  allTimezones,
  ITimezoneOption
} from 'react-timezone-select';
import { useMemo } from 'react';
import { defaultOption } from '@utils/constants';
import { CustomSelect } from '@components/interface';

export interface ITimezoneSelectProps extends Omit<SelectProps, 'onChange'> {
  onChange: (timezone: ITimezoneOption) => void;
  value?: string; // Accept timezone string as value
  date?: Date;
}

const labelStyle = 'original';
const timezones = {
  ...allTimezones,
  [defaultOption.value]: defaultOption.altName
  // other custom timezone goes here
};

const TimezoneSelect = ({ onChange, value, date = new Date(), ...rest }: ITimezoneSelectProps) => {
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle,
    timezones,
  });

  const stripLeadingGMT = (s: string) =>
    s.replace(/^\(GMT[+\-−]\d{1,2}:\d{2}\)\s*/i, '');

  const getOffsetForZoneAtDate = (timeZone: string, at: Date): string => {
    try {
      // Newer engines (support 'shortOffset'
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'shortOffset',
        hour: '2-digit',
        minute: '2-digit',
      });
      const off = fmt.formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? '';
      const m = off.replace('GMT', '').replace('UTC', '').match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
      const sign = m?.[1] ?? '+';
      const hh = String(Number(m?.[2] ?? '0')).padStart(2, '0');
      const mm = String(m?.[3] ?? '00').padStart(2, '0');
      return `${sign}${hh}:${mm}`;
    } catch {
      // Fallback: try 'short' and parse "GMT+X" // for older safari 2022 releases
      try {
        const fmt2 = new Intl.DateTimeFormat('en-US', {
          timeZone,
          timeZoneName: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        const tzName = fmt2.formatToParts(at).find(p => p.type === 'timeZoneName')?.value ?? '';
        const m2 = tzName.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/i);
        if (!m2) return '+00:00';
        const hh = String(Number(m2[1])).padStart(2, '0').replace(/^(-?)0?/, '$1'); // keep sign
        const sign = hh.startsWith('-') ? '-' : '+';
        const absHH = String(Math.abs(Number(hh))).padStart(2, '0');
        const mm = String(m2[2] ?? '00').padStart(2, '0');
        return `${sign}${absHH}:${mm}`;
      } catch {
        return '+00:00';
      }
    }
  };

  const timezoneOptions = useMemo(() => {
    const rewritten = options.map((o) => {
      const iana = String(o.value);
      const off = getOffsetForZoneAtDate(iana, date);
      const clean = stripLeadingGMT(String(o.label));
      return { value: iana, label: `(GMT${off}) ${clean}` };
    });
    return [defaultOption, ...rewritten];
  }, [options, date]);

  return (
    <CustomSelect
      isMulti={false}
      placeholder="Select Timezone"
      options={timezoneOptions}
      value={value ? timezoneOptions.find(opt => opt.value === value) || null : null}
      onChange={(selected) => {
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
      {...rest}
    />
  );
};

export default TimezoneSelect;