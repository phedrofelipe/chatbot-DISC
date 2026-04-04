import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, pass: string): Promise<any> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPass = this.configService.get<string>('ADMIN_PASSWORD');

    if (email === adminEmail && pass === adminPass) {
      return { email: adminEmail };
    }
    return null;
  }

  async login(email: string, pass: string) {
    const admin = await this.validateAdmin(email, pass);
    if (!admin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { email: admin.email, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
