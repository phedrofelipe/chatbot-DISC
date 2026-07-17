import { Request } from 'express';
import { UserRole } from '../common/enums/user-role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  departmentId: number | null;
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
  departmentId: number | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
