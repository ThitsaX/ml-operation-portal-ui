import React, { useState, useMemo, useEffect } from "react";
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
  Button,
  HStack
} from "@chakra-ui/react";
import { DayPicker } from "react-day-picker";
import { CalendarIcon, CloseIcon } from "@chakra-ui/icons";
import { format } from "date-fns";
import "react-day-picker/style.css";
import CustomSelect from "./CustomSelect";
import "./try.css";

interface Props {
  value?: string | Date;
  onChange: (e: { target: { value: string } }) => void;
}

type OptionType = {
  label: string;
  value: string;
};

// --- START: Dynamic Year Options Hook ---
const YEAR_RANGE = 20; // Show 0 years before/after selected

const useDynamicYearOptions = (selectedYear?: number) => {
  const [yearOffset, setYearOffset] = useState(0); // allows scrolling dynamically

  const years = useMemo(() => {
    const currentYear = selectedYear || new Date().getFullYear();
    const start = currentYear - YEAR_RANGE + yearOffset;
    const end = currentYear + YEAR_RANGE + yearOffset;
    return Array.from({ length: end - start + 1 }, (_, i) => ({
      label: (start + i).toString(),
      value: (start + i).toString(),
    }));
  }, [selectedYear, yearOffset]);

  const scrollYears = (direction: "up" | "down") => {
    setYearOffset((prev) => prev + (direction === "up" ? -1 : 1));
  };

  // Reset offset when selectedYear changes (e.g., when the value prop changes)
  useEffect(() => {
      setYearOffset(0);
  }, [selectedYear]);

  return { years, scrollYears };
};
// --- END: Dynamic Year Options Hook ---


export const CustomDateTimePicker: React.FC<Props> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const initialDate = useMemo<Date | null>(() =>
    value ? new Date(value) : null,
    [value]
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [month, setMonth] = useState<Date>(initialDate || new Date());

  // Sync like <input type="datetime-local">
  useEffect(() => {
    setSelectedDate(initialDate);
    if (initialDate) setMonth(initialDate);
  }, [initialDate]);

  const inputSize = useBreakpointValue({ base: "sm", md: "md" });

  const formatForDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`; // Note: Changed space to 'T' for proper datetime-local format
  };

  const formatForDisplay = (date: Date): string => {
    return format(date, "yyyy-MM-dd hh:mm a");
  };

  const emitChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const browserFormattedString = formatForDateTimeLocal(date);
      onChange({ target: { value: browserFormattedString } });
    } else {
      onChange({ target: { value: "" } });
    }
  };

  // Clear button handler
  const handleClear = () => {
    setSelectedDate(null);
    setMonth(new Date());
    onChange({ target: { value: "" } });
  };

  // Today button handler
  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setMonth(today);
    emitChange(today);
  };

  const handleDaySelect = (day?: Date | null) => {
    if (!day) return;
    if (!selectedDate) {
      const now = new Date();
      const updated = new Date(day);
      updated.setHours(now.getHours(), now.getMinutes());
      emitChange(updated);
    } else {
      const updated = new Date(day);
      updated.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      emitChange(updated);
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    if (!selectedDate) {
      const updated = new Date();
      updated.setHours(hour, minute);
      emitChange(updated);
    } else {
      const updated = new Date(selectedDate);
      updated.setHours(hour, minute);
      emitChange(updated);
    }
  };

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        label: format(new Date(2020, i), "MMMM"),
        value: i.toString(),
      })),
    []
  );

  // --- START: Dynamic Year Hook Integration ---
  const currentYear = selectedDate?.getFullYear() || new Date().getFullYear();
  const { years: yearOptions, scrollYears } = useDynamicYearOptions(currentYear);
  // --- END: Dynamic Year Hook Integration ---

  const hourOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const hour = i + 1;
        return { label: hour.toString(), value: hour.toString() };
      }),
    []
  );

  const minuteOptions = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        label: String(i).padStart(2, "0"),
        value: i.toString(),
      })),
    []
  );

  const amPmOptions = useMemo<OptionType[]>(
    () => [
      { label: "AM", value: "AM" },
      { label: "PM", value: "PM" },
    ],
    []
  );

  const selectedMonth = monthOptions.find(
    (opt) => opt.value === month.getMonth().toString()
  );

  // Find the currently selected year in the dynamic options
  const selectedYearOption = yearOptions.find(
    (opt) => opt.value === month.getFullYear().toString()
  );


  const currentHours = selectedDate
    ? selectedDate.getHours()
    : new Date().getHours();

  const selectedHour = hourOptions.find((opt) => {
    const displayHour = currentHours % 12 || 12;
    return opt.value === displayHour.toString();
  });

  const selectedMinute = minuteOptions.find(
    (opt) =>
      opt.value ===
      (selectedDate
        ? selectedDate.getMinutes()
        : new Date().getMinutes()
      ).toString()
  );

  const selectedAmPm = amPmOptions.find(
    (opt) => opt.value === (currentHours >= 12 ? "PM" : "AM")
  );

  const handleMonthChange = (val: OptionType | null) => {
    if (!val) return;
    const newMonth = Number(val.value);
    const updatedMonth = new Date(month.getFullYear(), newMonth, 1);
    setMonth(updatedMonth);
    if (selectedDate) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setMonth(newMonth);
      if (updatedDate.getMonth() !== newMonth) updatedDate.setDate(0);
      emitChange(updatedDate);
    }
  };

  const handleYearChange = (val: OptionType | null) => {
    if (!val) return;
    const newYear = Number(val.value);
    const updatedMonth = new Date(newYear, month.getMonth(), 1);
    setMonth(updatedMonth);
    if (selectedDate) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setFullYear(newYear);
      emitChange(updatedDate);
    }
  };

  const handleHourChange = (val: OptionType | null) => {
    if (!val) return;
    const newHour12 = Number(val.value);
    const currentAmPm = selectedAmPm?.value || "AM";
    let newHour24;
    if (currentAmPm === "AM") newHour24 = newHour12 === 12 ? 0 : newHour12;
    else newHour24 = newHour12 === 12 ? 12 : newHour12 + 12;
    handleTimeChange(newHour24, selectedDate ? selectedDate.getMinutes() : 0);
  };

  const handleMinuteChange = (val: OptionType | null) => {
    if (val)
      handleTimeChange(
        selectedDate ? selectedDate.getHours() : new Date().getHours(),
        Number(val.value)
      );
  };

  const handleAmPmChange = (val: OptionType | null) => {
    if (!val) return;
    const currentHour12 = currentHours % 12 || 12;
    const newAmPm = val.value;
    let newHour24;
    if (newAmPm === "AM") newHour24 = currentHour12 === 12 ? 0 : currentHour12;
    else newHour24 = currentHour12 === 12 ? 12 : currentHour12 + 12;
    handleTimeChange(newHour24, selectedDate ? selectedDate.getMinutes() : 0);
  };

  const displayValue = selectedDate ? formatForDisplay(selectedDate) : "";

  // Get the min and max year from the dynamic options for DayPicker range
  const minYear = yearOptions.length > 0 ? Number(yearOptions[0].value) : new Date().getFullYear() - YEAR_RANGE;
  const maxYear = yearOptions.length > 0 ? Number(yearOptions[yearOptions.length - 1].value) : new Date().getFullYear() + YEAR_RANGE;


  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="bottom-start"
//       closeOnBlur={true}
    >
      <PopoverTrigger>
        <Box w="full">
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

      <PopoverContent
        p={1}
        maxW="100%"
        borderRadius="md"
        className="date-time-popover"
      >
        <VStack spacing={1} w="full">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full" alignItems="center">
            <CustomSelect
              options={monthOptions}
              value={selectedMonth ?? null}
              onChange={handleMonthChange}
              width="85%"
              maxMenuHeight={200}
              menuPortalTarget={true}
              size="sm"
            />
            {/* --- START: Modified CustomSelect for Dynamic Years --- */}
            <CustomSelect
              options={yearOptions}
              value={selectedYearOption ?? null}
              onChange={handleYearChange}
              width="85%"
              maxMenuHeight={200}
              menuPortalTarget={true}
              size="sm"
            />
          </SimpleGrid>


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


          <Text
            fontSize="sm"
            fontWeight="semibold"
            textAlign={{ base: "center", sm: "left" }}
          >
            Time
          </Text>
          <SimpleGrid columns={{ base: 3, md: 3 }} spacing={1} w="full">
            <CustomSelect
              options={hourOptions}
              value={selectedHour ?? null}
              onChange={handleHourChange}
              width="85%"
              maxMenuHeight={200}
            size="sm"
            />
            <CustomSelect
              options={minuteOptions}
              value={selectedMinute ?? null}
              onChange={handleMinuteChange}
              width="85%"
              maxMenuHeight={200}
                size="sm"
            />
            <CustomSelect
              options={amPmOptions}
              value={selectedAmPm ?? null}
              onChange={handleAmPmChange}
              width="85%"
              maxMenuHeight={200}
                size="sm"
            />
          </SimpleGrid>

          <HStack spacing={4} w="full" justify="center">
            <Text
              onClick={handleToday}
              color="blue.500"
              fontSize="xs"
              cursor="pointer"
              fontWeight="medium"
              _hover={{ textDecoration: "underline" }}
              textAlign="center"
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
              textAlign="center"
            >
              Clear
            </Text>
          </HStack>
        </VStack>
      </PopoverContent>
    </Popover>
  );
};