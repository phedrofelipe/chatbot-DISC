import { IsBoolean } from 'class-validator';

export class ResetAllAnalysisDto {
  @IsBoolean()
  confirm: boolean;
}
