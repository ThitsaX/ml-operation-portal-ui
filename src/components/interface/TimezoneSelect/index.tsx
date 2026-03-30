import { SelectProps } from '@chakra-ui/react';
import {
  useTimezoneSelect,
  allTimezones,
  ITimezoneOption
} from 'react-timezone-select';
import { useMemo } from 'react';
import { CustomSelect } from '@components/interface';
import { FALLBACK_TIMEZONE } from '@utils/constants';
import { useTranslation } from 'react-i18next';
export interface ITimezoneSelectProps extends Omit<SelectProps, 'onChange'> {
  onChange: (timezone: ITimezoneOption) => void;
  value?: string; // Accept timezone string as value
  date?: Date;
}

const labelStyle = 'original';
const timezones = {
  ...allTimezones,
  // other custom timezone goes here
};

const TimezoneSelect = ({ onChange, value, date = new Date(), ...rest }: ITimezoneSelectProps) => {
  const { t } = useTranslation();
  const { options, parseTimezone } = useTimezoneSelect({
    labelStyle,
    timezones,
  });

  const stripLeadingGMT = (s: string) =>
    s.replace(/^\(GMT[+\-−]\d{1,2}:\d{2}\)\s*/i, '');

  const getOffsetForZoneAtDate = (timeZone: string, at: Date): string => {
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
  };

  const timezoneOptions = useMemo(() => {
    const rewritten = options.map((o) => {
      const iana = String(o.value);
      const off = getOffsetForZoneAtDate(iana, date);
      const clean = stripLeadingGMT(String(o.label));
      return { value: iana, label: `(GMT${off}) ${clean}` };
    });
    return [ ...rewritten];
  }, [options, date]);

  return (
    <CustomSelect
      isMulti={false}
      placeholder={t('ui.select_timezone')}
      options={timezoneOptions}
      value={value ? timezoneOptions.find(opt => opt.value === value) || FALLBACK_TIMEZONE : FALLBACK_TIMEZONE}
      onChange={(selected) => {
          const parsed = selected?.value || '';
          if (parsed) {
            onChange({value: parsed, label: selected?.label || parsed});
          } else {
            onChange(FALLBACK_TIMEZONE);
          }

      }}
    />
  );
};

export default TimezoneSelect;
