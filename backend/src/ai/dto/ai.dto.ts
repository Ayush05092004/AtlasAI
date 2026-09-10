import { IsString, Length } from 'class-validator';

export class GenerateTasksDto {
  @IsString()
  @Length(5, 500)
  goal!: string;
}
