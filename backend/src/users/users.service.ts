import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
// Sem 0/O/1/I/L — evita ambiguidade quando o colaborador copia o código à mão.
const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code +=
      ACCESS_CODE_ALPHABET[
        Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length)
      ];
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

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

  async create(
    dto: CreateCollaboratorDto,
  ): Promise<{ user: User; accessCode: string }> {
    await this.assertEmailAvailable(dto.email);
    await this.assertDepartmentExists(dto.departmentId);

    const accessCode = generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, SALT_ROUNDS);

    const newUser = this.usersRepository.create({
      nomeCompleto: dto.nomeCompleto,
      email: dto.email,
      departmentId: dto.departmentId,
      idade: dto.idade,
      regiao: dto.regiao,
      role: UserRole.COLABORADOR,
      password: null,
      accessCodeHash,
    });
    const user = await this.usersRepository.save(newUser);
    return { user, accessCode };
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

  // Público: dá acesso ao resultado já salvo mediante prova de posse do
  // código de acesso (evita que o e-mail sozinho seja suficiente, como era antes).
  async verifyAccessCode(email: string, accessCode: string): Promise<User> {
    const invalidCredentials = () =>
      new UnauthorizedException('E-mail ou código de acesso inválidos');

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.accessCodeHash')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.accessCodeHash) {
      throw invalidCredentials();
    }

    const matches = await bcrypt.compare(accessCode, user.accessCodeHash);
    if (!matches) {
      throw invalidCredentials();
    }

    return user;
  }

  // Usado só pelo login: Staff autentica com password, Colaborador com o
  // código de acesso (accessCodeHash) — por isso seleciona os dois hashes.
  async findByEmailWithCredentials(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.accessCodeHash')
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

  // Zera o resultado do quiz de um colaborador (mantém cadastro e histórico) e
  // emite um novo código de acesso, já que o antigo pode ter sido esquecido —
  // é este o mecanismo de recuperação para quem perdeu e-mail+código.
  async resetAnalysis(id: number): Promise<{ user: User; accessCode: string }> {
    const user = await this.findOne(id);
    if (user.role !== UserRole.COLABORADOR) {
      throw new ConflictException(
        'Somente colaboradores possuem respostas de quiz para reiniciar',
      );
    }

    const accessCode = generateAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, SALT_ROUNDS);

    await this.usersRepository.update(id, {
      analiseResult: null,
      scoreD: null,
      scoreI: null,
      scoreS: null,
      scoreC: null,
      primaryType: null,
      secondaryType: null,
      accessCodeHash,
    });

    return { user: await this.findOne(id), accessCode };
  }

  // Reset em massa: zera o resultado de TODOS os colaboradores (ex.: novo ciclo
  // de avaliação). Não deleta cadastros nem regenera códigos de acesso — como o
  // resultado deixa de existir, o colaborador entra direto no quiz sem precisar do código.
  async resetAllAnalysis(): Promise<{ affected: number }> {
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        analiseResult: null,
        scoreD: null,
        scoreI: null,
        scoreS: null,
        scoreC: null,
        primaryType: null,
        secondaryType: null,
      })
      .where('role = :role', { role: UserRole.COLABORADOR })
      .execute();

    return { affected: result.affected ?? 0 };
  }

  // Limpeza total: remove todos os Colaboradores, Líderes e Gestores, e todos
  // os departamentos — só a(s) conta(s) de Administrador permanece(m).
  async wipeData(): Promise<{
    removedUsers: number;
    removedDepartments: number;
  }> {
    const usersResult = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('role != :role', { role: UserRole.ADMIN })
      .execute();

    // Zera o departmentId de quem sobrou (só admins) para não travar o FK
    // RESTRICT de departments na exclusão abaixo.
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ departmentId: null })
      .execute();

    const departmentsResult = await this.departmentsRepository
      .createQueryBuilder()
      .delete()
      .from(Department)
      .execute();

    return {
      removedUsers: usersResult.affected ?? 0,
      removedDepartments: departmentsResult.affected ?? 0,
    };
  }
}
