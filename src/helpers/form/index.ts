import { z } from 'zod';

export class FormHelper { }

export class AuthHelper extends FormHelper {
  get loginSchema() {
    return z.object({
      email: z.string({ required_error: 'Required' }).email('invalid-email'),
      password: z.string({ required_error: 'Required' })
    });
  }

  get passwordChangeSchema(): any {
    return z
      .object({
        oldPassword: z.string({ required_error: 'Required' }),
        newPassword: z.string({ required_error: 'Required' }),
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
        user_role_type: z.enum(['ADMIN', 'OPERATION'], {
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
      user_role_type: z.enum(['ADMIN', 'OPERATION'], {
        required_error: 'Required'
      }),
      status: z.enum(['INACTIVE', 'ACTIVE'], {
        required_error: 'Required'
      })
    });
  }

  get resetPasswordSchema() {
    return z
      .object({
        email: z.string({ required_error: 'Required' }).email('invalid-email'),
        new_password: z.string({ required_error: 'Required' }),
        confirm_password: z.string({ required_error: 'Required' })
      })
      .refine((data) => data.new_password === data.confirm_password, {
        message: 'password-not-match',
        path: ['confirm_password']
      });
  }
}

export class CompanyInfoHelper extends FormHelper {
  get schema() {
    return z.object({
      participant_id: z.string().optional(),
      dfsp_code: z.string().optional(),
      name: z.string().optional(),
      address: z.string({ required_error: 'Required' }),
      mobile: z.string({ required_error: 'Required' }),

      business_contatct_id: z.string().optional(),
      business_contatct_name: z.string().optional(),
      business_contatct_title: z.string().optional(),
      business_contatct_email: z.string().optional(),
      business_contatct_mobile: z.string().optional(),

      technical_contatct_id: z.string().optional(),
      technical_contatct_name: z.string().optional(),
      technical_contatct_title: z.string().optional(),
      technical_contatct_email: z.string().optional(),
      technical_contatct_mobile: z.string().optional(),

      extra_property_list: z.array(
        z.object({
          extra_property_id: z.string().optional(),
          property_key: z.string().optional(),
          label: z.string().optional(),
          property_value: z.string().optional()
        })
      )
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

export class TransferHelper extends FormHelper {
  get schema() {
    return z.object({
      fromDate: z.string({ required_error: 'Required' }),
      toDate: z.string({ required_error: 'Required' }),
      transferId: z.string().optional(),
      payerFspId: z.string().optional(),
      payeeFspId: z.string().optional(),
      payerIdentifierTypeId: z.string().optional(),
      payeeIdentifierTypeId: z.string().optional(),
      payerIdentifierValue: z.string().optional(),
      payeeIdentifierValue: z.string().optional(),
      currencyId: z.string().optional(),
      transferStateId: z.string().optional()
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

export class AuditHelper extends FormHelper {
  get schema() {
    return z
      .object({
        fromDate: z.number({ required_error: 'Required' }),
        toDate: z.number({ required_error: 'Required' }),
        userId: z.string().optional(),
        actionName: z.string().optional(),
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
        .regex(/^\+[^a-zA-Z]*$/, 'Invalid mobile number format'),
      contactType: z.string({ required_error: 'Required' })
        .trim()
        .min(1, 'Contact Type is required'),
    });
  }
}


export class OrganizationHelper extends FormHelper {
  get schema() {
    return z.object({
      participantId: z.string().optional(),
      participantName: z.string().optional(),
      description: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Description is required'),
      address: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Address is required'),
      mobile: z
        .string({ required_error: 'Required' })
        .trim()
        .min(1, 'Mobile is required'),
      logoFileType: z.string().nullable().optional(),

      logo: z.string().optional(),
      createdDate: z.number().optional(),
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

export class FinalizeSettlementHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({ required_error: 'Required' }),
        endDate: z.coerce.date({ required_error: 'Required' }),
        state: z.string().optional(),
        currency: z.string().optional(),
        timeZoneOffset: z.string().optional()
      })
      .refine((data) => data.startDate < data.endDate, {
        message: 'End Date must not earlier than Start Date',
        path: ['endDate']
      });
  }
}

export class SettlementWindowHelper extends FormHelper {
  get schema() {
    return z
      .object({
        startDate: z.coerce.date({ required_error: 'Required' }),
        endDate: z.coerce.date({ required_error: 'Required' }),
        state: z.string().optional(),
        currency: z.string().optional(),
        timeZoneOffset: z.string().optional()
      })
      .refine((data) => data.startDate < data.endDate, {
        message: 'End Date must not earlier than Start Date',
        path: ['endDate']
      });
  }
}