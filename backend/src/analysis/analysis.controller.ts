import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalysisService } from './analysis.service';
import { UsersService } from '../users/users.service';
import { DepartmentsService } from '../departments/departments.service';
import { GenerateAnalysisDto } from './dto/generate-analysis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedRequest } from '../auth/types';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  // Público: fluxo de auto-atendimento do colaborador ao concluir o quiz.
  // Tracker é por IP: um pico de colaboradores terminando o quiz ao mesmo
  // tempo atrás do mesmo NAT da empresa compartilha essa cota.
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post()
  async analyze(@Body() dto: GenerateAnalysisDto) {
    return this.analysisService.generateAnalysis(dto);
  }

  // Colaborador não acessa este endpoint — ele vê o próprio resultado via
  // GET /users/me (mesmo formato do ResultScreen), não o painel agregado.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GESTOR, UserRole.LIDER)
  @Get('dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest) {
    const departmentId =
      req.user.role === UserRole.LIDER ? req.user.departmentId : undefined;
    const users = await this.usersService.findAllForDashboard(
      departmentId ?? undefined,
    );

    let label = 'toda a organização (múltiplos departamentos)';
    if (req.user.role === UserRole.LIDER && departmentId) {
      const department = await this.departmentsService.findOne(departmentId);
      label = `a equipe do departamento ${department.name}`;
    }

    return this.analysisService.generateDashboardAnalysis(users, { label });
  }
}
