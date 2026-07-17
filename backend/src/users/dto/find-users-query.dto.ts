import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';

export class FindUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;
}
