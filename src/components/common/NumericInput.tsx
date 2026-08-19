// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
import React from 'react';
import { Input } from '@chakra-ui/react';
import { numericInputRegex, normalizeNumericPaste } from '@helpers';
import Decimal from 'decimal.js';

interface NumericInputProps {
  value?: string | number;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  onInvalid?: (message: string) => void;
  placeholder?: string;
  maxDecimals?: number;
  min?: number;
  max?: number;
  'aria-label'?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onBlur: onBlurProp,
  onInvalid: onInvalidProp,
  placeholder,
  maxDecimals = 2,
  min,
  max,
  ['aria-label']: ariaLabel
}) => {
  // Permissive change handler: allow intermediate input (e.g. '.', '0.', '.5')
  const permissiveRegex = /^\d*[.,]?\d*$/;
  const handleChange = (nextRaw: string) => {
    const next = String(nextRaw);
    if (next === '') {
      onChange('');
      return;
    }

    // allow permissive patterns while typing
    if (!permissiveRegex.test(next)) return;

    // don't enforce decimal length strictly here to avoid blocking user typing
    onChange(next);
  };

  // Strict validation on blur/commit
  const handleBlur = (currentRaw: string) => {
    const normalized = normalizeNumericPaste(String(currentRaw));
    if (normalized === '') {
      onBlurProp?.('');
      return;
    }

    // enforce decimal places
    if (maxDecimals !== undefined) {
      const parts = normalized.split('.');
      if (parts[1] && parts[1].length > maxDecimals) {
        onInvalidProp?.(`Maximum ${maxDecimals} decimal places allowed`);
        return;
      }
    }

    // numeric range checks using Decimal for precision
    let num: Decimal;
    try {
      num = new Decimal(normalized);
    } catch {
      onInvalidProp?.('Invalid number');
      return;
    }

    if (min !== undefined) {
      const minDec = new Decimal(min);
      if (num.lt(minDec)) {
        onInvalidProp?.(`Minimum value is ${min}`);
        return;
      }
    }
    if (max !== undefined) {
      const maxDec = new Decimal(max);
      if (num.gt(maxDec)) {
        onInvalidProp?.(`Maximum value is ${max}`);
        return;
      }
    }

    // commit normalized value
    onChange(normalized);
    onBlurProp?.(normalized);
  };

  // Use shared normalize helper from @helpers

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={String(value ?? '')}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={(e) => handleBlur(e.target.value)}
      onPaste={(e) => {
        e.preventDefault();
        const paste = e.clipboardData?.getData('text') || '';
        const normalized = normalizeNumericPaste(paste);
        if (normalized === '' || numericInputRegex.test(normalized)) {
          if (maxDecimals !== undefined) {
            const parts = normalized.split('.');
            if (parts[1] && parts[1].length > maxDecimals) return;
          }
          // on paste we commit the normalized value immediately
          onChange(normalized);
        }
      }}
    />
  );
};

export default NumericInput;
