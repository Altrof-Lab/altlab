import { Module } from '@nestjs/common';
import { BrowserProfilesController } from './browser-profiles.controller';
import { BrowserProfilesService } from './browser-profiles.service';
import { BotforgeModule } from '../../integrations/botforge/botforge.module';
import { SpyhubModule } from '../../integrations/spyhub/spyhub.module';
import { PersonasModule } from '../personas/personas.module';

@Module({
  imports: [BotforgeModule, SpyhubModule, PersonasModule],
  controllers: [BrowserProfilesController],
  providers: [BrowserProfilesService],
  exports: [BrowserProfilesService],
})
export class BrowserProfilesModule {}

