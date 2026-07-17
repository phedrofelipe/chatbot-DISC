import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SeedAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedAdminService.name);

  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const existingAdmins = await this.usersService.countByRole(UserRole.ADMIN);
    if (existingAdmins > 0) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const nomeCompleto =
      this.configService.get<string>('ADMIN_NAME') || 'Administrador';

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL/ADMIN_PASSWORD não configurados — nenhum administrador inicial foi criado.',
      );
      return;
    }

    await this.usersService.createStaff({
      nomeCompleto,
      email,
      password,
      role: UserRole.ADMIN,
    });

    this.logger.log(`Administrador inicial criado: ${email}`);
  }
}
