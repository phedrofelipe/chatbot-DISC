import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.departmentsRepository.findOneBy({
      name: dto.name,
    });
    if (existing) {
      throw new ConflictException('Já existe um departamento com esse nome');
    }
    const department = this.departmentsRepository.create(dto);
    return this.departmentsRepository.save(department);
  }

  async findAll(): Promise<Department[]> {
    return this.departmentsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.departmentsRepository.findOneBy({ id });
    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }
    return department;
  }

  async update(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOne(id);
    if (dto.name && dto.name !== department.name) {
      const existing = await this.departmentsRepository.findOneBy({
        name: dto.name,
      });
      if (existing) {
        throw new ConflictException('Já existe um departamento com esse nome');
      }
    }
    Object.assign(department, dto);
    return this.departmentsRepository.save(department);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    const usersInDepartment = await this.usersRepository.count({
      where: { departmentId: id },
    });
    if (usersInDepartment > 0) {
      throw new ConflictException(
        'Não é possível remover um departamento com usuários vinculados',
      );
    }
    await this.departmentsRepository.delete(id);
  }
}
