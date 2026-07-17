import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { SeedAdminService } from './seed-admin.service';

@Module({
  imports: [ConfigModule, UsersModule],
  providers: [SeedAdminService],
})
export class DatabaseModule {}
