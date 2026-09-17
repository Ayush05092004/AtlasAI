import { IsString, Length } from 'class-validator';

export class GenerateTasksDto {
  @IsString()
  @Length(5, 500)
  goal!: string;
}

export class QuickAddDto {
  @IsString()
  @Length(2, 300)
  text!: string;
}
