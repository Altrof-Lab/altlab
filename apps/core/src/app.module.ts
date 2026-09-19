import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { BrowserProfilesModule } from './modules/browser-profiles/browser-profiles.module';

@Module({
  imports: [AffiliateModule, BrowserProfilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
