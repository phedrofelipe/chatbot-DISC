import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(() => {
    usersService = {
      findByEmailWithPassword: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    };
    authService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
  });

  it('rejeita login para e-mail inexistente', async () => {
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue(null);
    await expect(
      authService.login('nao-existe@teste.com', 'qualquer'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita login de um Colaborador (sem senha/login)', async () => {
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'colaborador@teste.com',
      role: UserRole.COLABORADOR,
      password: null,
      departmentId: null,
    });
    await expect(
      authService.login('colaborador@teste.com', 'qualquer'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita senha incorreta', async () => {
    const hashed = await bcrypt.hash('senha-correta', 10);
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'admin@teste.com',
      role: UserRole.ADMIN,
      password: hashed,
      departmentId: null,
    });
    await expect(
      authService.login('admin@teste.com', 'senha-errada'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('autentica com sucesso e retorna token + papel', async () => {
    const hashed = await bcrypt.hash('senha-correta', 10);
    (usersService.findByEmailWithPassword as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'admin@teste.com',
      nomeCompleto: 'Admin',
      role: UserRole.ADMIN,
      password: hashed,
      departmentId: null,
    });

    const result = await authService.login('admin@teste.com', 'senha-correta');

    expect(result.access_token).toBe('signed-token');
    expect(result.role).toBe(UserRole.ADMIN);
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 1,
        email: 'admin@teste.com',
        role: UserRole.ADMIN,
      }),
    );
  });
});
