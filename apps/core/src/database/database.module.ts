import { Global, Module } from '@nestjs/common';
import { databaseProviders, DRIZZLE_CLIENT } from './database.provider';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [DRIZZLE_CLIENT],
})
export class DatabaseModule {}
