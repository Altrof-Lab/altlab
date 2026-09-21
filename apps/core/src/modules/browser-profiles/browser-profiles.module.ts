import { Module } from '@nestjs/common';
import { BrowserProfilesController } from './browser-profiles.controller';
import { BrowserProfilesService } from './browser-profiles.service';
import { BotforgeModule } from '../../integrations/botforge/botforge.module';
import { SpyhubModule } from '../../integrations/spyhub/spyhub.module';

@Module({
  imports: [BotforgeModule, SpyhubModule],
  controllers: [BrowserProfilesController],
  providers: [BrowserProfilesService],
  exports: [BrowserProfilesService],
})
export class BrowserProfilesModule {}
