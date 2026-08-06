import type { ErrorCode, ErrorReference } from '@minerva/typescript-lib';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * The body every failed request answers with, whichever of the filter's three
 * paths produced it -- one shape, so a client needs one branch.
 *
 * {@link message} and {@link payload} are written for a developer and are absent
 * in production; {@link code} is the i18n key a user-facing client renders from.
 */
export class ErrorResponse {
  @ApiProperty({
    description: 'The class that was thrown, or the class the filter wrapped what was thrown in.',
    example: 'HttpRequestError',
  })
  name: string;

  @ApiProperty({
    description: 'The permanent code for this failure. Doubles as the i18n key a client renders a message from.',
    example: 'ERR_002',
    pattern: '^ERR_\\d{3}$',
  })
  code: ErrorCode;

  @ApiProperty({
    description: 'Identifies the throw site. Constant per error class, so it names a line of code rather than a run.',
    example: '3910ce24-5dd9-4fe1-815e-b31ef45695e2',
    format: 'uuid',
  })
  reference: ErrorReference;

  @ApiProperty({
    description: 'The id of the request this failed on, matching the `X-MINERVA-REQUEST-ID` header and the log line.',
    example: '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31',
    format: 'uuid',
  })
  requestId: string;

  @ApiProperty({
    description: 'When the answer was produced, in UTC.',
    format: 'date-time',
    example: '2026-08-06T09:41:12.004Z',
  })
  date: string;

  @ApiPropertyOptional({
    description: 'What went wrong, in English, for a developer. Absent in production.',
    example: 'Minerva could not serve this request.',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'Whatever the throw site attached to the error. Absent in production.',
    type: 'object',
    additionalProperties: true,
    example: { exception: 'BadRequestException' },
  })
  payload?: Record<string, unknown>;
}
