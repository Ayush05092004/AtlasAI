import { IsString, IsOptional, IsEnum, Length, Matches } from 'class-validator';

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateProjectDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Matches(/^[A-Z0-9]{2,6}$/, {
    message: 'Key must be 2-6 uppercase letters/numbers',
  })
  key!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
