import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyAccessDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  accessCode: string;
}
