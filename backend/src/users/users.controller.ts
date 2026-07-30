import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Delete,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { VerifyAccessDto } from './dto/verify-access.dto';
import { ResetAllAnalysisDto } from './dto/reset-all-analysis.dto';
import { WipeDataDto } from './dto/wipe-data.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedRequest } from '../auth/types';
import type { User } from './entities/user.entity';

// Recorte público e seguro do colaborador: nunca inclui analiseResult/scores,
// que só podem ser obtidos comprovando posse do código de acesso.
function toPublicSummary(user: User) {
  return {
    id: user.id,
    nomeCompleto: user.nomeCompleto,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    idade: user.idade,
    regiao: user.regiao,
    hasResult: !!user.analiseResult,
  };
}

const WIPE_CONFIRMATION_PHRASE = 'APAGAR TUDO';

function toPublicResult(user: User) {
  return {
    id: user.id,
    nomeCompleto: user.nomeCompleto,
    email: user.email,
    departmentId: user.departmentId,
    idade: user.idade,
    regiao: user.regiao,
    analiseResult: user.analiseResult,
    scoreD: user.scoreD,
    scoreI: user.scoreI,
    scoreS: user.scoreS,
    scoreC: user.scoreC,
    primaryType: user.primaryType,
    secondaryType: user.secondaryType,
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Público: fluxo de auto-cadastro do colaborador para o quiz DISC.
  @Post()
  async create(@Body() dto: CreateCollaboratorDto) {
    const { user, accessCode } = await this.usersService.create(dto);
    return { ...toPublicSummary(user), accessCode };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('staff')
  async createStaff(@Body() dto: CreateStaffUserDto) {
    return this.usersService.createStaff(dto);
  }

  // Público: só confirma se o e-mail já está cadastrado e se o quiz foi concluído
  // (hasResult) — nunca expõe o resultado, que exige o código de acesso.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    return user ? toPublicSummary(user) : null;
  }

  // Público: recupera o resultado já salvo mediante e-mail + código de acesso
  // (mostrado uma única vez ao colaborador no cadastro/reset).
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-access')
  async verifyAccess(@Body() dto: VerifyAccessDto) {
    const user = await this.usersService.verifyAccessCode(
      dto.email,
      dto.accessCode,
    );
    return toPublicResult(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GESTOR, UserRole.LIDER)
  @Get()
  async findAll(
    @Query() query: FindUsersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const scope =
      req.user.role === UserRole.LIDER
        ? { departmentId: req.user.departmentId }
        : {};
    return this.usersService.findAll(query, scope);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.remove(id);
    return { success: true };
  }

  // Zera o resultado de UM colaborador (mantém cadastro) e gera um novo código
  // de acesso, que o admin deve repassar ao colaborador fora desta plataforma.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/reset-analysis')
  async resetAnalysis(@Param('id', ParseIntPipe) id: number) {
    const { user, accessCode } = await this.usersService.resetAnalysis(id);
    return { ...toPublicSummary(user), accessCode };
  }

  // Reset em massa: zera o resultado de TODOS os colaboradores (ex.: novo
  // ciclo de avaliação). Ação destrutiva — exige confirmação explícita no corpo.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('reset-all-analysis')
  async resetAllAnalysis(@Body() dto: ResetAllAnalysisDto) {
    if (!dto.confirm) {
      throw new BadRequestException(
        'É necessário confirmar explicitamente esta ação destrutiva (confirm: true)',
      );
    }
    return this.usersService.resetAllAnalysis();
  }

  // Limpeza total: apaga Colaboradores, Líderes, Gestores e todos os
  // departamentos, mantendo só a(s) conta(s) de Administrador. Irreversível —
  // exige a frase de confirmação exata, não só um booleano.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('wipe-data')
  async wipeData(@Body() dto: WipeDataDto) {
    if (dto.confirmationPhrase !== WIPE_CONFIRMATION_PHRASE) {
      throw new BadRequestException(
        `Para confirmar esta ação irreversível, envie confirmationPhrase: "${WIPE_CONFIRMATION_PHRASE}"`,
      );
    }
    return this.usersService.wipeData();
  }
}
