import { thousandSeparatorRegex } from '@helpers'
import { capitalize, snakeCase, trim } from 'lodash-es'
import { useToast } from '@chakra-ui/react'

export function humanize(str: string): string {
  return capitalize(trim(snakeCase(str).replace(/_id$/, '').replace(/_/g, ' ')))
}

export function filterNonDigits({
  value,
  maxDecimal = 2
}: {
  value: string
  maxDecimal?: number
}): string {
  const filteredDigits = value.replace(/[^0-9.-]/g, '')
  const decimalIndex = filteredDigits.indexOf('.')

  return decimalIndex !== -1
    ? filteredDigits.substring(0, decimalIndex + (maxDecimal + 1))
    : filteredDigits
}

/**
 * React-compatitable thousand separator
 */
export function thousandSeparator({
  value,
  delimiter = ',',
  allowFromZero = false
}: {
  value: string | number
  delimiter?: string
  allowFromZero?: boolean
}): string {
  const amount = filterNonDigits({ value: `${value ?? ''}` })

  if (!allowFromZero && amount.match(/^-?0/g) != null) {
    return ''
  }
  if (allowFromZero && (!value || amount.match(/^-?0/g) != null)) {
    return value === '' ? value : '0'
  }

  return amount.replace(thousandSeparatorRegex, delimiter)
}

export const formatNumberWithCommas = (
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
): string => {
  const num = Number(value);
  if (value === null || value === undefined || isNaN(num)) return '-';

  return num.toLocaleString('en-US', options);
};

export const showDataNotFound = (toast: ReturnType<typeof useToast>) => {
  toast({
    position: 'top',
    description: 'No data found',
    status: 'warning',
    isClosable: true,
    duration: 3000,
  });
};