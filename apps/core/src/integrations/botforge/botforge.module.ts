import { Module } from '@nestjs/common';
import { BotforgeClient } from './botforge.client';

@Module({
  providers: [BotforgeClient],
  exports: [BotforgeClient],
})
export class BotforgeModule {}
