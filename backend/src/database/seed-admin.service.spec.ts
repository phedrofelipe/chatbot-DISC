import { SeedAdminService } from './seed-admin.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('SeedAdminService', () => {
  let usersService: any;
  let configService: any;
  let service: SeedAdminService;

  beforeEach(() => {
    usersService = {
      countByRole: jest.fn(),
      createStaff: jest.fn(),
    };
    configService = {
      get: jest.fn(),
    };
    service = new SeedAdminService(usersService, configService);
  });

  it('não cria admin se já existir um', async () => {
    usersService.countByRole.mockResolvedValue(1);
    await service.onApplicationBootstrap();
    expect(usersService.createStaff).not.toHaveBeenCalled();
  });

  it('não cria admin se envs obrigatórias estiverem ausentes', async () => {
    usersService.countByRole.mockResolvedValue(0);
    configService.get.mockReturnValue(undefined);
    await service.onApplicationBootstrap();
    expect(usersService.createStaff).not.toHaveBeenCalled();
  });

  it('cria o admin inicial a partir das envs quando nenhum admin existe', async () => {
    usersService.countByRole.mockResolvedValue(0);
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        ADMIN_EMAIL: 'admin@empresa.com',
        ADMIN_PASSWORD: 'senha-forte',
        ADMIN_NAME: 'Administrador Geral',
      };
      return values[key];
    });

    await service.onApplicationBootstrap();

    expect(usersService.createStaff).toHaveBeenCalledWith({
      nomeCompleto: 'Administrador Geral',
      email: 'admin@empresa.com',
      password: 'senha-forte',
      role: UserRole.ADMIN,
    });
  });
});
