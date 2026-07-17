import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ScoresDto {
  @IsInt()
  @Min(0)
  @Max(10)
  D: number;

  @IsInt()
  @Min(0)
  @Max(10)
  I: number;

  @IsInt()
  @Min(0)
  @Max(10)
  S: number;

  @IsInt()
  @Min(0)
  @Max(10)
  C: number;
}

class AnswerDto {
  @IsString()
  q: string;

  @IsString()
  a: string;

  @IsIn(['D', 'I', 'S', 'C'])
  type: string;
}

export class GenerateAnalysisDto {
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => ScoresDto)
  scores: ScoresDto;

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
