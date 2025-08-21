import { z } from 'zod';

export class FormHelper {}

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
        from_date: z.number({ required_error: 'Required' }),
        to_date: z.number({ required_error: 'Required' })
      })
      .refine((value) => value.from_date < value.to_date, {
        message: 'Should be less than to date',
        path: ['from_date']
      })
      .refine((value) => value.from_date < value.to_date, {
        message: 'Should be greater than from date',
        path: ['to_date']
      });
  }
}
