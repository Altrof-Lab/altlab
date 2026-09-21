import { Module } from '@nestjs/common';
import { SpyhubClient } from './spyhub.client';

@Module({
  providers: [SpyhubClient],
  exports: [SpyhubClient],
})
export class SpyhubModule {}
