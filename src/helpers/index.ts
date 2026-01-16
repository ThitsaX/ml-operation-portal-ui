export const thousandSeparatorRegex = /\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g // thousand separators regex to replace comma

export const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}|:;<>,.?/\[\]]).{6,}$/;

export const amountTwoDecimalRegex = /^([0-9]\d*|0)?(\.\d{0,2})?$/;

export const numericInputRegex = /^\d*\.?\d*$/;

export const REPORT_NOT_FOUND_ERROR = 'RESULT_NOT_FOUND_EXCEPTION';