import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class AgentChatTurnDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class AgentChatDto {
  @IsString()
  @Length(1, 2000)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => AgentChatTurnDto)
  history?: AgentChatTurnDto[];
}
