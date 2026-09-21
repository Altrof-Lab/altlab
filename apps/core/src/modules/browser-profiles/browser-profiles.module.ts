import { Module } from '@nestjs/common';
import { BrowserProfilesController } from './browser-profiles.controller';
import { BrowserProfilesService } from './browser-profiles.service';
import { BotforgeModule } from '../../integrations/botforge/botforge.module';

@Module({
  imports: [BotforgeModule],
  controllers: [BrowserProfilesController],
  providers: [BrowserProfilesService],
  exports: [BrowserProfilesService],
})
export class BrowserProfilesModule {}
