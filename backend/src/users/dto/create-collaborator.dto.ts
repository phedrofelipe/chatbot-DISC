import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  nomeCompleto: string;

  @IsEmail()
  email: string;

  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(14)
  @Max(100)
  idade: number;

  @IsString()
  @IsNotEmpty()
  regiao: string;
}
