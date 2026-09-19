import { Module } from '@nestjs/common';
import { BrowserProfilesController } from './browser-profiles.controller';
import { BrowserProfilesService } from './browser-profiles.service';

@Module({
  controllers: [BrowserProfilesController],
  providers: [BrowserProfilesService],
  exports: [BrowserProfilesService],
})
export class BrowserProfilesModule {}
