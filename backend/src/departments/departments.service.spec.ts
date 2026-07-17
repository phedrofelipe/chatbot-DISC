import { ConflictException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let departmentsRepository: any;
  let usersRepository: any;
  let service: DepartmentsService;

  beforeEach(() => {
    departmentsRepository = {
      findOneBy: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
      find: jest.fn(),
      delete: jest.fn(),
    };
    usersRepository = {
      count: jest.fn(),
    };
    service = new DepartmentsService(departmentsRepository, usersRepository);
  });

  it('cria um departamento quando o nome ainda não existe', async () => {
    departmentsRepository.findOneBy.mockResolvedValue(null);
    const result = await service.create({ name: 'Financeiro' });
    expect(result.name).toBe('Financeiro');
  });

  it('rejeita nome de departamento duplicado', async () => {
    departmentsRepository.findOneBy.mockResolvedValue({
      id: 1,
      name: 'Financeiro',
    });
    await expect(service.create({ name: 'Financeiro' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('lança NotFoundException ao buscar departamento inexistente', async () => {
    departmentsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('bloqueia remoção de departamento com usuários vinculados', async () => {
    departmentsRepository.findOneBy.mockResolvedValue({ id: 1, name: 'TI' });
    usersRepository.count.mockResolvedValue(3);
    await expect(service.remove(1)).rejects.toThrow(ConflictException);
  });

  it('remove departamento sem usuários vinculados', async () => {
    departmentsRepository.findOneBy.mockResolvedValue({ id: 1, name: 'TI' });
    usersRepository.count.mockResolvedValue(0);
    await service.remove(1);
    expect(departmentsRepository.delete).toHaveBeenCalledWith(1);
  });
});
