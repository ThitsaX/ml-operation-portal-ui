import { amountTwoDecimalRegex } from "@helpers";

export interface ValidationResult {
    isValid: boolean;
    errorMessage: string;
}

export const validateAmount = (value: string, fieldLabel: string): ValidationResult => {

    if (!value) {
        return { isValid: false, errorMessage: `` };
    }

    if (!amountTwoDecimalRegex.test(value)) {
        return { isValid: false, errorMessage: `${fieldLabel} must have max 2 decimal places` };
    }

    if (Number(value) <= 0) {
        return { isValid: false, errorMessage: `${fieldLabel} must be greater than 0` };
    }

    return { isValid: true, errorMessage: "" };
};
