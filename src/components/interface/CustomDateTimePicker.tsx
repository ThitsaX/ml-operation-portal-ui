import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Box,
  VStack,
  useBreakpointValue,
  Text,
  SimpleGrid,
  HStack,
  useOutsideClick
} from "@chakra-ui/react";
import { DayPicker } from "react-day-picker";
import { CalendarIcon } from "@chakra-ui/icons";
import { format } from "date-fns";
import "react-day-picker/style.css";
import CustomSelect from "./CustomSelect";
import "./CustomDateTimeStyle.css";

interface Props {
  value?: string | Date;
  onChange: (e: { target: { value: string } }) => void;
  onBlur?: () => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  borderWidth?: string;
  _disabled?: any;
}

type OptionType = {
  label: string;
  value: string;
};

// Constants
const TIME_OPTIONS = {
  hours: Array.from({ length: 12 }, (_, i) => ({
    label: (i + 1).toString(),
    value: (i + 1).toString(),
  })),
  minutes: Array.from({ length: 60 }, (_, i) => ({
    label: String(i).padStart(2, "0"),
    value: i.toString(),
  })),
  seconds: Array.from({ length: 60 }, (_, i) => ({
    label: String(i).padStart(2, "0"),
    value: i.toString(),
  })),
  ampm: [
    { label: "AM", value: "AM" },
    { label: "PM", value: "PM" },
  ],
  months: Array.from({ length: 12 }, (_, i) => ({
    label: format(new Date(2020, i), "MMMM"),
    value: i.toString(),
  })),
};

// Custom Hook for Dynamic Years
const YEAR_RANGE = 30;
const useDynamicYearOptions = (selectedYear?: number) => {
  const [yearOffset, setYearOffset] = useState(0);

  const years = useMemo(() => {
    const currentYear = selectedYear || new Date().getFullYear();
    const start = currentYear - YEAR_RANGE + yearOffset;
    const end = currentYear + YEAR_RANGE + yearOffset;
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      label: (start + i).toString(),
      value: (start + i).toString(),
    }));
  }, [selectedYear, yearOffset]);

  useEffect(() => setYearOffset(0), [selectedYear]);
  return { years };
};

// Date Formatting Utilities
const formatForDateTimeLocal = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const formatForDisplay = (date: Date): string => {
  return format(date, "MM/dd/yyyy hh:mm:ss a");
};


export const CustomDateTimePicker = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      value,
      onChange,
      disabled = false,
      placeholder = "Select date and time",
      ...props
    },
    ref
  ) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputSize = useBreakpointValue({ base: "sm", md: "md" });

  // Date State Management
  const initialDate = useMemo(() => value ? new Date(value) : null, [value]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [month, setMonth] = useState<Date>(initialDate || new Date());

  // Refs for popover and dropdown detection
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Enhanced outside click handler that ignores dropdown menus
  useOutsideClick({
    ref: popoverRef,
    handler: (event) => {
      if (disabled) return; // Don't close if disabled

      const target = event.target as Element;
      const isReactSelectDropdown =
        target.closest('.react-select__menu') ||
        target.closest('.react-select__dropdown') ||
        target.closest('.react-select__menu-list') ||
        target.closest('[id*="react-select"]');

      if (!isReactSelectDropdown) {
        setIsOpen(false);
      }
    },
  });

  // Sync with external value changes
  useEffect(() => {
    setSelectedDate(initialDate);
    if (initialDate) setMonth(initialDate);
  }, [initialDate]);

  // Dynamic Year Options
  const currentYear = selectedDate?.getFullYear() || new Date().getFullYear();
  const { years: yearOptions } = useDynamicYearOptions(currentYear);

  // Event Handlers
  const emitChange = useCallback((date: Date | null) => {
    if (disabled) return; // Don't emit changes if disabled

    setSelectedDate(date);
    onChange({
      target: { value: date ? formatForDateTimeLocal(date) : "" }
    });
  }, [onChange, disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    setSelectedDate(null);
    setMonth(new Date());
    emitChange(null);
  }, [emitChange, disabled]);

  const handleToday = useCallback(() => {
    if (disabled) return;
    const today = new Date();
    setSelectedDate(today);
    setMonth(today);
    emitChange(today);
  }, [emitChange, disabled]);

  const handleDaySelect = useCallback((day?: Date | null) => {
    if (disabled || !day) return;

    const updated = new Date(day);
    if (selectedDate) {
      updated.setHours(
        selectedDate.getHours(),
        selectedDate.getMinutes(),
        selectedDate.getSeconds()
      );
    } else {
      const now = new Date();
      updated.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }
    emitChange(updated);
  }, [selectedDate, emitChange, disabled]);

  const handleTimeChange = useCallback(
    (hour: number, minute: number, second: number) => {
      if (disabled) return;

      const updated = selectedDate ? new Date(selectedDate) : new Date();
      updated.setHours(hour, minute, second);
      emitChange(updated);
    },
    [selectedDate, emitChange, disabled]
  );

  // Selection Handlers
  const handleMonthChange = useCallback((val: OptionType | null) => {
    if (disabled || !val || !selectedDate) return;

    const newMonth = Number(val.value);
    const updatedDate = new Date(selectedDate);
    updatedDate.setMonth(newMonth);
    if (updatedDate.getMonth() !== newMonth) updatedDate.setDate(0);

    setMonth(new Date(updatedDate.getFullYear(), newMonth, 1));
    emitChange(updatedDate);
  }, [selectedDate, emitChange, disabled]);

  const handleYearChange = useCallback((val: OptionType | null) => {
    if (disabled || !val || !selectedDate) return;

    const newYear = Number(val.value);
    const updatedDate = new Date(selectedDate);
    updatedDate.setFullYear(newYear);

    setMonth(new Date(newYear, month.getMonth(), 1));
    emitChange(updatedDate);
  }, [selectedDate, month, emitChange, disabled]);

  const handleHourChange = useCallback((val: OptionType | null) => {
    if (disabled || !val) return;

    const newHour12 = Number(val.value);
    const currentAmPm = getSelectedAmPm();
    const newHour24 = convert12to24(newHour12, currentAmPm);

    handleTimeChange(
      newHour24,
      selectedDate?.getMinutes() ?? new Date().getMinutes(),
      selectedDate?.getSeconds() ?? new Date().getSeconds()
    );
  }, [selectedDate, handleTimeChange, disabled]);

  const handleMinuteChange = useCallback((val: OptionType | null) => {
    if (disabled || !val) return;
    handleTimeChange(
        selectedDate?.getHours() ?? new Date().getHours(),
        Number(val.value),
        selectedDate?.getSeconds() ?? new Date().getSeconds()
    );
  }, [selectedDate, handleTimeChange, disabled]);

  const handleSecondChange = useCallback((val: OptionType | null) => {
    if (disabled || !val) return;
    handleTimeChange(
      selectedDate?.getHours() ?? new Date().getHours(),
      selectedDate?.getMinutes() ?? new Date().getMinutes(),
      Number(val.value)
    );
  }, [selectedDate, handleTimeChange, disabled]);

  const handleAmPmChange = useCallback((val: OptionType | null) => {
    if (disabled || !val) return;

    const currentHour12 = getCurrentHours12();
    const newHour24 = convert12to24(currentHour12, val.value);

    handleTimeChange(
      newHour24,
      selectedDate?.getMinutes() ?? new Date().getMinutes(),
      selectedDate?.getSeconds() ?? new Date().getSeconds()
    );
  }, [selectedDate, handleTimeChange, disabled]);

  // Helper Functions
  const getCurrentHours12 = () => {
    const currentHours = selectedDate?.getHours() || new Date().getHours();
    return currentHours % 12 || 12;
  };

  const getSelectedAmPm = () => {
    const currentHours = selectedDate?.getHours() || new Date().getHours();
    return currentHours >= 12 ? "PM" : "AM";
  };

  const convert12to24 = (hour12: number, ampm: string) => {
    if (ampm === "AM") return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
  };

  // Selected Values
  const selectedValues = useMemo(() => ({
    month: TIME_OPTIONS.months.find(opt => opt.value === month.getMonth().toString()),
    year: yearOptions.find(opt => opt.value === month.getFullYear().toString()),
    hour: TIME_OPTIONS.hours.find(opt => opt.value === getCurrentHours12().toString()),
    minute: TIME_OPTIONS.minutes.find(opt =>
      opt.value === (selectedDate?.getMinutes() ?? new Date().getMinutes()).toString()
    ),
    second: TIME_OPTIONS.seconds.find(opt =>
      opt.value === (selectedDate?.getSeconds() ?? new Date().getSeconds()).toString()
    ),
    ampm: TIME_OPTIONS.ampm.find(opt => opt.value === getSelectedAmPm()),
  }), [selectedDate, month, yearOptions]);

  const displayValue = selectedDate ? formatForDisplay(selectedDate) : "";

  // DayPicker Range
  const [minYear, maxYear] = useMemo((): [number, number] => {
    const first = yearOptions[0] ? Number(yearOptions[0].value) : new Date().getFullYear() - YEAR_RANGE;
    const last = yearOptions[yearOptions.length - 1] ? Number(yearOptions[yearOptions.length - 1].value) : new Date().getFullYear() + YEAR_RANGE;
    return [first, last];
  }, [yearOptions]);

  return (
    <Box ref={popoverRef}>
      <Popover
        isOpen={isOpen && !disabled} // Don't open if disabled
        onClose={() => setIsOpen(false)}
        placement="bottom"
        closeOnBlur={false}
      >
        <PopoverTrigger>
          <Box w="full" ref={triggerRef}>
            <InputGroup size={inputSize}>
              <Input
                value={displayValue}
                readOnly
                ref={ref} // ✅ forward ref here
                cursor={disabled ? "not-allowed" : "pointer"}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="date-time-input"
                fontSize="sm"
                placeholder={placeholder}
                isDisabled={disabled} // Chakra UI disabled prop
                opacity={disabled ? 0.6 : 1}
                {...props} // Spread other props like borderWidth, etc.
              />
              <InputRightElement>
                <IconButton
                  aria-label="Select date and time"
                  icon={<CalendarIcon />}
                  size={inputSize}
                  variant="ghost"
                  isDisabled={disabled} // Disable button too
                  onClick={(e) => {
                    if (disabled) return;
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                />
              </InputRightElement>
            </InputGroup>
          </Box>
        </PopoverTrigger>

        <PopoverContent p={1} maxW="100%" borderRadius="md" className="date-time-popover">
          <VStack spacing={1} w="full">
            {/* Month/Year Selectors */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full" alignItems="center">
              <CustomSelect
                options={TIME_OPTIONS.months}
                value={selectedValues.month ?? null}
                onChange={handleMonthChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled} // Disable selects when component is disabled
              />
              <CustomSelect
                options={yearOptions}
                value={selectedValues.year ?? null}
                onChange={handleYearChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled}
              />
            </SimpleGrid>

            {/* Day Picker */}
            <DayPicker
              mode="single"
              selected={selectedDate || undefined}
              onSelect={handleDaySelect}
              month={month}
              onMonthChange={setMonth}
              startMonth={new Date(minYear, 0)}
              endMonth={new Date(maxYear, 11)}
              showOutsideDays
              captionLayout="label"
              // DayPicker doesn't have a direct disabled prop, but days won't be clickable due to our handler
            />

            {/* Time Selectors */}
            <Text fontSize="sm" fontWeight="semibold" textAlign={{ base: "center", sm: "left" }}>
              Time
            </Text>
            <SimpleGrid columns={3} spacing={1} w="full">
              <CustomSelect
                options={TIME_OPTIONS.hours}
                value={selectedValues.hour ?? null}
                onChange={handleHourChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled}
              />
              <CustomSelect
                options={TIME_OPTIONS.minutes}
                value={selectedValues.minute ?? null}
                onChange={handleMinuteChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled}
              />
              <CustomSelect
                options={TIME_OPTIONS.seconds}
                value={selectedValues.second ?? null}
                onChange={handleSecondChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled}
              />
              <Box/>
              <CustomSelect
                options={TIME_OPTIONS.ampm}
                value={selectedValues.ampm ?? null}
                onChange={handleAmPmChange}
                width="100%"
                maxMenuHeight={200}
                size="sm"
                isDisabled={disabled}
              />
            </SimpleGrid>

            {/* Action Buttons */}
            <HStack spacing={4} w="full" justify="center">
              <Text
                onClick={handleToday}
                color={disabled ? "gray.400" : "blue.500"}
                fontSize="xs"
                cursor={disabled ? "not-allowed" : "pointer"}
                fontWeight="medium"
                _hover={disabled ? {} : { textDecoration: "underline" }}
              >
                Today
              </Text>
              <Text
                onClick={handleClear}
                color={disabled ? "gray.400" : "blue.500"}
                fontSize="xs"
                cursor={disabled ? "not-allowed" : "pointer"}
                fontWeight="medium"
                _hover={disabled ? {} : { textDecoration: "underline" }}
              >
                Clear
              </Text>
            </HStack>
          </VStack>
        </PopoverContent>
      </Popover>
    </Box>
  );
});
