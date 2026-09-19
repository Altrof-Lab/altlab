import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AffiliateModule } from './modules/affiliate/affiliate.module';

@Module({
  imports: [AffiliateModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
