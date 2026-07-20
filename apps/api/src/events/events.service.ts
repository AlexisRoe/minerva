import { createHelloEvent, EVENT_STREAM, type HelloEventResponse } from '@minerva/shared';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaRwService } from '../database/prisma-rw.service';
import { ValkeyService } from '../valkey/valkey.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly valkey: ValkeyService,
    private readonly prismaRw: PrismaRwService,
  ) {}

  async publishHello(message: string): Promise<HelloEventResponse> {
    const payload = createHelloEvent(message, 'api');
    const eventId = await this.valkey.publish(EVENT_STREAM, payload);

    await this.prismaRw.eventLog.create({
      data: { type: payload.type, message: payload.message, source: payload.source },
    });

    this.logger.log(`published hello event ${eventId}`);
    return { eventId };
  }
}
