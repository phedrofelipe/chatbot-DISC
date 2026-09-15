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
    const user = await this.usersService.findByEmailWithCredentials(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Staff usa senha; Colaborador usa o código de acesso gerado no cadastro
    // (mesmo campo "password" do formulário, verificado contra outro hash).
    const credentialHash =
      user.role === UserRole.COLABORADOR ? user.accessCodeHash : user.password;
    if (!credentialHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, credentialHash);
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
