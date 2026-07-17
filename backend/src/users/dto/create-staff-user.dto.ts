import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateStaffUserDto {
  @IsString()
  @IsNotEmpty()
  nomeCompleto: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole.ADMIN | UserRole.GESTOR | UserRole.LIDER;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;
}
