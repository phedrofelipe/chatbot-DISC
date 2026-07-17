import {
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
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateCollaboratorDto } from './dto/create-collaborator.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedRequest } from '../auth/types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Público: fluxo de auto-cadastro do colaborador para o quiz DISC.
  @Post()
  async create(@Body() dto: CreateCollaboratorDto) {
    return this.usersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('staff')
  async createStaff(@Body() dto: CreateStaffUserDto) {
    return this.usersService.createStaff(dto);
  }

  // Público: autoatendimento do colaborador (retomar quiz / ver resultado pelo próprio e-mail).
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
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
}
