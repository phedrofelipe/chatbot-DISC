import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user || user.role === UserRole.COLABORADOR || !user.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      nomeCompleto: user.nomeCompleto,
      departmentId: user.departmentId,
    };
  }
}
