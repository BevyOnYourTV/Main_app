import { PipeTransform, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { z, type ZodError } from 'zod';
import { PROTOCOL_VERSION, type ServerError } from './realtime-protocol.schema';

@Injectable()
export class ZodWsValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errorResponse = this.formatZodError(result.error);
      throw new WsException(errorResponse);
    }

    return result.data;
  }

  private formatZodError(error: ZodError): ServerError {
    const details = error.issues.map(
      (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`,
    );

    const isVersionError = error.issues.some((issue) => issue.path[0] === 'v');

    return {
      v: PROTOCOL_VERSION,
      timestamp: Date.now(),
      error: {
        code: isVersionError ? 'PROTOCOL_ERROR' : 'INVALID_PAYLOAD',
        message: isVersionError
          ? 'Invalid or unsupported protocol version'
          : 'Message validation failed',
        details,
      },
    };
  }
}