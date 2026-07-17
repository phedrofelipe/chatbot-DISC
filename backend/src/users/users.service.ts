import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
  ) {}

  private async assertDepartmentExists(departmentId: number): Promise<void> {
    const department = await this.departmentsRepository.findOneBy({
      id: departmentId,
    });
    if (!department) {
      throw new NotFoundException('Departamento não encontrado');
    }
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.usersRepository.findOneBy({ email });
    if (existing) {
      throw new ConflictException('Já existe um usuário com esse e-mail');
    }
  }

  async create(dto: CreateCollaboratorDto): Promise<User> {
    await this.assertEmailAvailable(dto.email);
    await this.assertDepartmentExists(dto.departmentId);

    const newUser = this.usersRepository.create({
      nomeCompleto: dto.nomeCompleto,
      email: dto.email,
      departmentId: dto.departmentId,
      idade: dto.idade,
      regiao: dto.regiao,
      role: UserRole.COLABORADOR,
      password: null,
    });
    return this.usersRepository.save(newUser);
  }

  async createStaff(dto: CreateStaffUserDto): Promise<User> {
    if (dto.role === UserRole.LIDER && !dto.departmentId) {
      throw new ConflictException(
        'Um Líder precisa estar vinculado a um departamento',
      );
    }
    await this.assertEmailAvailable(dto.email);
    if (dto.departmentId) {
      await this.assertDepartmentExists(dto.departmentId);
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const newUser = this.usersRepository.create({
      nomeCompleto: dto.nomeCompleto,
      email: dto.email,
      role: dto.role,
      password: hashedPassword,
      departmentId:
        dto.role === UserRole.LIDER
          ? dto.departmentId
          : (dto.departmentId ?? null),
    });
    return this.usersRepository.save(newUser);
  }

  async updateAnalysis(
    userId: number,
    result: unknown,
    scores: { D: number; I: number; S: number; C: number },
    primaryType: string,
    secondaryType: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      analiseResult: JSON.stringify(result),
      scoreD: scores.D,
      scoreI: scores.I,
      scoreS: scores.S,
      scoreC: scores.C,
      primaryType,
      secondaryType,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['department'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.usersRepository.count({ where: { role } });
  }

  async findAllForDashboard(departmentId?: number | null): Promise<User[]> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.role = :role', { role: UserRole.COLABORADOR })
      .orderBy('user.createdAt', 'DESC');

    if (departmentId) {
      qb.andWhere('user.departmentId = :departmentId', { departmentId });
    }

    return qb.getMany();
  }

  async findAll(
    query: FindUsersQueryDto,
    scope: { departmentId?: number | null } = {},
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (scope.departmentId) {
      qb.andWhere('user.departmentId = :departmentId', {
        departmentId: scope.departmentId,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.departmentId) {
      await this.assertDepartmentExists(dto.departmentId);
      user.departmentId = dto.departmentId;
    }
    if (dto.nomeCompleto) user.nomeCompleto = dto.nomeCompleto;
    if (dto.idade !== undefined) user.idade = dto.idade;
    if (dto.regiao) user.regiao = dto.regiao;
    if (dto.role) user.role = dto.role;
    if (dto.password)
      user.password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.usersRepository.delete(id);
  }
}
