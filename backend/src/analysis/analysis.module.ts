import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';

@Module({
  imports: [ConfigModule, UsersModule, DepartmentsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
