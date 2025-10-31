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
const YEAR_RANGE = 20;
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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatForDisplay = (date: Date): string => {
  return format(date, "MM/dd/yyyy hh:mm a");
};

export const CustomDateTimePicker: React.FC<Props> = ({ value, onChange }) => {
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
    setSelectedDate(date);
    onChange({
      target: { value: date ? formatForDateTimeLocal(date) : "" }
    });
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSelectedDate(null);
    setMonth(new Date());
    emitChange(null);
  }, [emitChange]);

  const handleToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setMonth(today);
    emitChange(today);
  }, [emitChange]);

  const handleDaySelect = useCallback((day?: Date | null) => {
    if (!day) return;

    const updated = new Date(day);
    if (selectedDate) {
      updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    } else {
      const now = new Date();
      updated.setHours(now.getHours(), now.getMinutes());
    }
    emitChange(updated);
  }, [selectedDate, emitChange]);

  const handleTimeChange = useCallback((hour: number, minute: number) => {
    const updated = selectedDate ? new Date(selectedDate) : new Date();
    updated.setHours(hour, minute);
    emitChange(updated);
  }, [selectedDate, emitChange]);

  // Selection Handlers
  const handleMonthChange = useCallback((val: OptionType | null) => {
    if (!val || !selectedDate) return;

    const newMonth = Number(val.value);
    const updatedDate = new Date(selectedDate);
    updatedDate.setMonth(newMonth);
    if (updatedDate.getMonth() !== newMonth) updatedDate.setDate(0);

    setMonth(new Date(updatedDate.getFullYear(), newMonth, 1));
    emitChange(updatedDate);
  }, [selectedDate, emitChange]);

  const handleYearChange = useCallback((val: OptionType | null) => {
    if (!val || !selectedDate) return;

    const newYear = Number(val.value);
    const updatedDate = new Date(selectedDate);
    updatedDate.setFullYear(newYear);

    setMonth(new Date(newYear, month.getMonth(), 1));
    emitChange(updatedDate);
  }, [selectedDate, month, emitChange]);

  const handleHourChange = useCallback((val: OptionType | null) => {
    if (!val) return;

    const newHour12 = Number(val.value);
    const currentAmPm = getSelectedAmPm();
    const newHour24 = convert12to24(newHour12, currentAmPm);

    handleTimeChange(newHour24, selectedDate?.getMinutes() || 0);
  }, [selectedDate, handleTimeChange]);

  const handleMinuteChange = useCallback((val: OptionType | null) => {
    if (!val) return;
    handleTimeChange(selectedDate?.getHours() || new Date().getHours(), Number(val.value));
  }, [selectedDate, handleTimeChange]);

  const handleAmPmChange = useCallback((val: OptionType | null) => {
    if (!val) return;

    const currentHour12 = getCurrentHours12();
    const newHour24 = convert12to24(currentHour12, val.value);

    handleTimeChange(newHour24, selectedDate?.getMinutes() || 0);
  }, [selectedDate, handleTimeChange]);

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
      opt.value === (selectedDate?.getMinutes() || new Date().getMinutes()).toString()
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
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom" closeOnBlur={false}>
      <PopoverTrigger>
          <Box w="full" ref={triggerRef}>
          <InputGroup size={inputSize}>
            <Input
              value={displayValue}
              readOnly
              cursor="pointer"
              onClick={() => setIsOpen(!isOpen)}
              className="date-time-input"
              placeholder="Select date and time"
            />
            <InputRightElement>
              <IconButton
                aria-label="Select date and time"
                icon={<CalendarIcon />}
                size={inputSize}
                variant="ghost"
                onClick={(e) => {
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
              menuPortalTarget
              size="sm"
            />
            <CustomSelect
              options={yearOptions}
              value={selectedValues.year ?? null}
              onChange={handleYearChange}
              width="100%"
              maxMenuHeight={200}
              menuPortalTarget
              size="sm"
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
            />
            <CustomSelect
              options={TIME_OPTIONS.minutes}
              value={selectedValues.minute ?? null}
              onChange={handleMinuteChange}
              width="100%"
              maxMenuHeight={200}
              size="sm"
            />
            <CustomSelect
              options={TIME_OPTIONS.ampm}
              value={selectedValues.ampm ?? null}
              onChange={handleAmPmChange}
              width="100%"
              maxMenuHeight={200}
              size="sm"
            />
          </SimpleGrid>

          {/* Action Buttons */}
          <HStack spacing={4} w="full" justify="center">
            <Text
              onClick={handleToday}
              color="blue.500"
              fontSize="xs"
              cursor="pointer"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              Today
            </Text>
            <Text
              onClick={handleClear}
              color="blue.500"
              fontSize="xs"
              cursor="pointer"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
            >
              Clear
            </Text>
          </HStack>
        </VStack>
      </PopoverContent>
    </Popover>
    </Box>
  );
};