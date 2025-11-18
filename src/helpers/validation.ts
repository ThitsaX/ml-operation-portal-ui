import Decimal from "decimal.js";
import { amountTwoDecimalRegex } from "@helpers";

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export const validateAmount = (
  value: string,
  fieldLabel: string,
  maxValue?: string | number
): ValidationResult => {
  const errors: string[] = [];
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    errors.push(``);
    return { isValid: false, errorMessage: `` };
  }

  let numericValue: Decimal;
  try {
    numericValue = new Decimal(trimmedValue);
  } catch {
    return { isValid: false, errorMessage: `${fieldLabel} must be a valid number` };
  }

  if (numericValue.lte(0)) {
    return { isValid: false, errorMessage: `${fieldLabel} must be greater than 0` };
  }

  if (!amountTwoDecimalRegex.test(trimmedValue)) {
    return { isValid: false, errorMessage: `${fieldLabel} must have max 2 decimal places` };
  }

  if (maxValue !== undefined) {
    const maxDecimal = new Decimal(maxValue);
    if (numericValue.gt(maxDecimal)) {
      return { isValid: false, errorMessage: `${fieldLabel} cannot exceed ${maxValue}` };
    }
  }

   return { isValid: true, errorMessage: "" };

};
