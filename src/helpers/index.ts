// SPDX-License-Identifier: Apache-2.0
// Copyright 2024-2026 ThitsaWorks Pte. Ltd.
export const thousandSeparatorRegex = /\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g // thousand separators regex to replace comma

export const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}|:;<>,.?/\[\]]).{6,}$/;

export const amountTwoDecimalRegex = /^([0-9]\d*|0)?(\.\d{0,2})?$/;

export const numericInputRegex = /^\d*\.?\d*$/;

export const REPORT_NOT_FOUND_ERROR = 'RESULT_NOT_FOUND_EXCEPTION';

export const normalizeNumericPaste = (text: string) => {
	let s = String(text).trim().replace(/\s+/g, '');

	// Remove plus/minus and common currency symbols
	s = s.replace(/[+\-€$£¥₹]/g, '');

	// Keep only digits, dot and comma
	s = s.replace(/[^0-9.,]/g, '');

	// If both dot and comma present, assume comma is thousands separator
	if (s.includes('.') && s.includes(',')) {
		s = s.replace(/,/g, '');
	} else if (s.includes(',') && !s.includes('.')) {
		// Treat comma as decimal separator
		s = s.replace(/,/g, '.');
	}

	// Collapse multiple dots to first dot
	const parts = s.split('.');
	if (parts.length > 2) {
		s = parts.shift() + '.' + parts.join('');
	}

	return s;
};