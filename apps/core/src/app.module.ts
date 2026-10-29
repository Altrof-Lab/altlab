import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { BrowserProfilesModule } from './modules/browser-profiles/browser-profiles.module';
import { PersonasModule } from './modules/personas/personas.module';

@Module({
  imports: [DatabaseModule, AffiliateModule, BrowserProfilesModule, PersonasModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

