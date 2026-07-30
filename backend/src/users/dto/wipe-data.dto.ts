import { IsString } from 'class-validator';

export class WipeDataDto {
  @IsString()
  confirmationPhrase: string;
}
