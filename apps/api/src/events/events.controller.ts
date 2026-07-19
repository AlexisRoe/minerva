import type { HelloEventResponse } from '@minerva/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { CreateHelloEventDto } from './create-hello-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('hello')
  publishHello(@Body() dto: CreateHelloEventDto): Promise<HelloEventResponse> {
    return this.eventsService.publishHello(dto.message);
  }
}
