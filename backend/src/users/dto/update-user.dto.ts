import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(14)
  @Max(100)
  idade?: number;

  @IsOptional()
  @IsString()
  regiao?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
