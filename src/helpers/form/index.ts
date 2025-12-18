import { z } from 'zod';
import { passwordRegex } from '@helpers';

export class FormHelper { }

export class AuthHelper extends FormHelper {
  get loginSchema() {
    return z.object({
      email: z.string({ required_error: 'Required' }).email('invalid-email'),
      password: z.string({ required_error: 'Required' })
    });
  }

  get passwordChangeSchema(): any {
    const newPasswordSchema = z
      .string({ required_error: 'Password is required' })
      .regex(
        passwordRegex,
        'Password must be at least 6 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
      );

    return z
      .object({
        oldPassword: z.string({ required_error: 'Required' }),
        newPassword: newPasswordSchema,
        confirmPassword: z.string({ required_error: 'Required' })
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'password-not-match',
        path: ['confirmPassword']
      });
  }
}

export class ParticipantHelper extends FormHelper {
  get registerSchema() {
    return z
      .object({
        first_name: z.string({ required_error: 'Required' }),
        last_name: z.string({ required_error: 'Required' }),
        email: z.string({ required_error: 'Required' }).email('invalid-email'),
        job_title: z.string({ required_error: 'Required' }),
        participant_id: z.string({ required_error: 'Required' }),
        userRoleType: z.enum(['ADMIN', 'OPERATION'], {
          required_error: 'Required'
        }),
        status: z.enum(['INACTIVE', 'ACTIVE'], {
          required_error: 'Required'
        }),
        password: z.string({ required_error: 'Required' }),
        confirm_password: z.string({ required_error: 'Required' })
      })
      .refine((data) => data.password === data.confirm_password, {
        message: 'password-not-match',
        path: ['confirm_password']
      });
  }

  get editUserSchema() {
    return z.object({
      first_name: z.string({ required_error: 'Required' }),
      last_name: z.string({ required_error: 'Required' }),
      email: z.string({ required_error: 'Required' }).email('invalid-email'),
      job_title: z.string({ required_error: 'Required' }),
      participant_id: z.string({ required_error: 'Required' }),
      userRoleType: z.enum(['ADMIN', 'OPERATION'], {
        required_error: 'Required'
      }),
      status: z.enum(['INACTIVE', 'ACTIVE'], {
        required_error: 'Required'
      })
    });
  }

  get resetPasswordSchema() {
    const newPasswordSchema = z
      .string({ required_error: 'Password is required' })
      .regex(
        passwordRegex,
        'Password must be at least 6 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
      );

    return z
      .object({
        email: z.string({ required_error: 'Required' }).email('invalid-email'),
        newPassword: newPasswordSchema,
        confirmPassword: z.string({ required_error: 'Required' })
      })
      .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'password-not-match',
        path: ['confirmPassword']
      });
  }
}

export class UserManagementHelper extends FormHelper {
  get schema() {
    const newPasswordSchema = z
      .string({ required_error: 'Password is required' })
      .regex(
        passwordRegex,
        'Password must be at least 6 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'
      );

    return z.object({
      firstName: z.string().min(1, 'First Name is required'),
      lastName: z.string().min(1, 'Last Name is required'),
      email: z.string().email('Invalid email').min(1, 'Email is required'),
      participantId: z.string().min(1, 'Organization is required'),
      roleIdList: z.array(z.string()).min(1, 'Select at least one role'),
      jobTitle: z.string().optional(),
      status: z.string().optional(),
      userId: z.string().optional(),
      password: newPasswordSchema,
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });
  }

  get editSchema() {
    return z.object({
      firstName: z.string().min(1, 'First Name is required'),
      lastName: z.string().min(1, 'Last Name is required'),
      email: z.string().email('Invalid email').min(1, 'Email is required'),
      participantId: z.string().min(1, 'Organization is required'),
      roleIdList: z.array(z.string()).min(1, 'Select at least one role'),
      jobTitle: z.string().optional(),
      status: z.string().optional(),
      userId: z.string().optional(),
    });
  }
}

export class SettlementReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        start_date: z.coerce.date({
          required_error: 'Required'
        }),
        end_date: z.coerce.date({
          required_error: 'Required'
        }),
        settlement_id: z.string().optional(),
        fspid: z.string().optional(),
        file_type: z.string().optional(),
        time_zone_offset: z.string().optional()
      })
      .refine((data) => data.start_date < data.end_date, {
        message: 'End Date must not earlier than Start Date',
        path: ['end_date']
      });
  }
}

export class SettlementDetailReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({
          required_error: 'Required'
        }),
        endDate: z.coerce.date({
          required_error: 'Required'
        }),
        settlementId: z.string().optional(),
        fspId: z.string().optional(),
        fileType: z.string().optional(),
        timezoneOffset: z.string().optional()
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be less than end date',
        path: ['startDate']
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be greater than start date',
        path: ['endDate']
      });
  }
}

export class SettlementSummaryReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({
          required_error: 'Required'
        }),
        endDate: z.coerce.date({
          required_error: 'Required'
        }),
        settlementId: z.string().optional(),
        fspId: z.string().optional(),
        fileType: z.string().optional(),
        timezoneOffset: z.string().optional()
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be less than end date',
        path: ['startDate']
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be greater than start date',
        path: ['endDate']
      });
  }
}

export class SettlementStatementReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({
          required_error: 'Required'
        }),
        endDate: z.coerce.date({
          required_error: 'Required'
        }),
        fspId: z.string().optional(),
        currencyId: z.string().optional(),
        fileType: z.string().optional(),
        timezoneOffset: z.string().optional()
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be less than end date',
        path: ['startDate']
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be greater than start date',
        path: ['endDate']
      });
  }
}

export class TransferHelper extends FormHelper {
  get schema() {
    return z.object({
      fromDate: z.string({ required_error: 'Required' })
      .min(1, 'Invalid date'),
      toDate: z.string({ required_error: 'Required' })
      .min(1, 'Invalid date'),
      transferId: z.string().optional(),
      payerFspId: z.string().optional(),
      payeeFspId: z.string().optional(),
      payerIdentifierTypeId: z.string().optional(),
      payeeIdentifierTypeId: z.string().optional(),
      payerIdentifierValue: z.string().optional(),
      payeeIdentifierValue: z.string().optional(),
      currencyId: z.string().optional(),
      transferStateId: z.string().optional()
     })
      .refine((data) => data.fromDate < data.toDate, {
        message: 'To Date must not earlier than From Date',
        path: ['toDate']
      });
  }
}

export class FeeReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        start_date: z.coerce.date({ required_error: 'Required' }),
        end_date: z.coerce.date({ required_error: 'Required' }),
        fromFspId: z.string().optional(),
        toFspId: z.string().optional(),
        file_type: z.string().optional(),
        time_zone_offset: z.string().optional()
      })
      .refine((data) => data.start_date < data.end_date, {
        message: 'End Date must not earlier than Start Date',
        path: ['end_date']
      });
  }
}

export class SettlementBankReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({
          required_error: 'Required'
        }),
        endDate: z.coerce.date({
          required_error: 'Required'
        }),
        currency: z.string().optional(),
        settlementId: z.string().optional(),
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be less than end date',
        path: ['startDate']
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be greater than start date',
        path: ['endDate']
      });
  }
}

export class SettlementWindowHelper extends FormHelper {
  get schema() {
    return z
      .object({
        fromDate: z.string({ required_error: 'Required' })
        .min(1, 'Invalid date'),
        toDate: z.string({ required_error: 'Required' })
        .min(1, 'Invalid date'),
        state: z.string().optional(),
        currency: z.string().optional(),
        timeZoneOffset: z.string().optional()
      })
      .refine((data) => data.fromDate < data.toDate, {
        message: 'To Date must not earlier than From Date',
        path: ['toDate']
      });
  }
}

export class FinalizeSettlementHelper extends FormHelper {
  get schema() {
    return z
      .object({
        fromDate: z.string({ required_error: 'Required' })
        .min(1, 'Invalid date'),
        toDate: z.string({ required_error: 'Required' })
        .min(1, 'Invalid date'),
        state: z.string().optional(),
        currency: z.string().optional(),
        timeZoneOffset: z.string().optional()
      })
      .refine((data) => data.fromDate < data.toDate, {
        message: 'To Date must not earlier than From Date',
        path: ['toDate']
      });
  }
}

export class AuditHelper extends FormHelper {
  get schema() {
    return z
      .object({
        fromDate: z.string({ required_error: 'Required' }),
        toDate: z.string({ required_error: 'Required' }),
        actionId: z.string().optional(),
        userId: z.string().optional(),
      })
      .refine((value) => value.fromDate < value.toDate, {
        message: 'Should be less than to date',
        path: ['fromDate']
      })
      .refine((value) => value.fromDate < value.toDate, {
        message: 'Should be greater than from date',
        path: ['toDate']
      });
  }
}

export class AuditReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        fromDate: z.string({ required_error: 'Required' }),
        toDate: z.string({ required_error: 'Required' }),
        userId: z.string().optional(),
        action: z.string().optional(),
        fileType: z.string().optional(),
      })
      .refine((value) => value.fromDate < value.toDate, {
        message: 'Should be less than to date',
        path: ['fromDate']
      })
      .refine((value) => value.fromDate < value.toDate, {
        message: 'Should be greater than from date',
        path: ['toDate']
      });
  }
}

export class SettlementAuditReportHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.string({ required_error: 'Required' }),
        endDate: z.string({ required_error: 'Required' }),
        dfspId: z.string().optional(),
        currencyId: z.string().optional(),
        fileType: z.string().optional(),
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be less than end date',
        path: ['startDate']
      })
      .refine((value) => value.startDate < value.endDate, {
        message: 'Should be greater than start date',
        path: ['endDate']
      });
  }
}

export class OrganizationHelper extends FormHelper {
  get schema() {
    return z.object({
      participantId: z.string().optional(),
      participantName: z.string().optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      mobile: z.string().optional(),
      logoFileType: z.string().nullable().optional(),
      logo: z.string().optional(),
      createdDate: z.number().optional(),
    });
  }
}

export class ContactHelper extends FormHelper {
  get schema() {
    return z.object({
      participantId: z.string().optional(),
      contactId: z.string().optional(),
      name: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Name is required'),
      position: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Position is required'),
      email: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Email is required'),
      mobile: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Mobile is required')
        .regex(/^\+[^a-zA-Z]*$/, 'Please include the country code (e.g., +1…)'),
      contactType: z.string({ required_error: 'Required' })
        .trim()
        .min(1, 'Contact Type is required'),
    });
  }
}

export class LiquidityHelper extends FormHelper {
  get schema() {
    return z.object({
      participantId: z.string().optional(),
      liquidityProfileId: z.string().optional(),
      bankName: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Bank Name is required'),
      accountName: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Account Name is required'),
      accountNumber: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Account Number is required'),
      currency: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Currency is required'),
    });
  }
}
