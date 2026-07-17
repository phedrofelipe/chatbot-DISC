import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AnalysisModule } from './analysis/analysis.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';
import { Department } from './departments/entities/department.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, Department],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AnalysisModule,
    UsersModule,
    AuthModule,
    DepartmentsModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
