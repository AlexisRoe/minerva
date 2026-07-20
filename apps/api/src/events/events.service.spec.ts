import { EVENT_STREAM } from '@minerva/shared';
import type { PrismaRwService } from '../database/prisma-rw.service';
import type { ValkeyService } from '../valkey/valkey.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  it('publishes the event to the stream and records it in the database', async () => {
    const publish = vi.fn().mockResolvedValue('42-0');
    const create = vi.fn().mockResolvedValue({});
    const valkey = { publish } as unknown as ValkeyService;
    const prismaRw = { eventLog: { create } } as unknown as PrismaRwService;

    const service = new EventsService(valkey, prismaRw);
    const result = await service.publishHello('hi there');

    expect(result).toEqual({ eventId: '42-0' });
    expect(publish).toHaveBeenCalledWith(
      EVENT_STREAM,
      expect.objectContaining({ type: 'hello', message: 'hi there', source: 'api' }),
    );
    expect(create).toHaveBeenCalledWith({
      data: { type: 'hello', message: 'hi there', source: 'api' },
    });
  });
});
