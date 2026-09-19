import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServerStatusDto } from '@altlab/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }

  @Get('servers')
  getServers(): ServerStatusDto[] {
    return this.appService.getServers();
  }
}
