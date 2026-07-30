import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('UsersService', () => {
  let usersRepository: any;
  let departmentsRepository: any;
  let service: UsersService;

  beforeEach(() => {
    usersRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
      count: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    departmentsRepository = {
      findOneBy: jest.fn(),
    };
    service = new UsersService(usersRepository, departmentsRepository);
  });

  describe('create (colaborador)', () => {
    it('cria um colaborador quando e-mail é único e departamento existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      departmentsRepository.findOneBy.mockResolvedValue({ id: 1, name: 'TI' });

      const { user, accessCode } = await service.create({
        nomeCompleto: 'João Silva',
        email: 'joao@teste.com',
        departmentId: 1,
        idade: 30,
        regiao: 'Sudeste',
      });

      expect(user.role).toBe(UserRole.COLABORADOR);
      expect(user.password).toBeNull();
      expect(accessCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(user.accessCodeHash).not.toBe(accessCode);
    });

    it('rejeita e-mail duplicado', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: 5 });
      await expect(
        service.create({
          nomeCompleto: 'Duplicado',
          email: 'existe@teste.com',
          departmentId: 1,
          idade: 30,
          regiao: 'Sul',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita departamento inexistente', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      departmentsRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.create({
          nomeCompleto: 'Sem Depto',
          email: 'novo@teste.com',
          departmentId: 999,
          idade: 25,
          regiao: 'Norte',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStaff', () => {
    it('exige departamento para o papel Líder', async () => {
      await expect(
        service.createStaff({
          nomeCompleto: 'Líder Sem Depto',
          email: 'lider@teste.com',
          password: 'senhaforte123',
          role: UserRole.LIDER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('cria staff com senha hasheada (nunca em texto puro)', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      departmentsRepository.findOneBy.mockResolvedValue({ id: 2, name: 'RH' });

      const result = await service.createStaff({
        nomeCompleto: 'Líder RH',
        email: 'lider.rh@teste.com',
        password: 'senhaforte123',
        role: UserRole.LIDER,
        departmentId: 2,
      });

      expect(result.password).not.toBe('senhaforte123');
      expect(result.departmentId).toBe(2);
    });
  });

  describe('findOne', () => {
    it('lança NotFoundException quando o usuário não existe', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('countByRole', () => {
    it('delega para o repositório com o filtro de papel', async () => {
      usersRepository.count.mockResolvedValue(1);
      const total = await service.countByRole(UserRole.ADMIN);
      expect(total).toBe(1);
      expect(usersRepository.count).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });
  });
});
