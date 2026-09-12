import {
  IsString,
  IsOptional,
  IsEnum,
  Length,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export { TaskStatus, TaskPriority };

export class CreateTaskDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  estimateHrs?: number;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  estimateHrs?: number;
}

/** Used specifically by the kanban board when a card is dragged to a new column/position. */
export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsInt()
  position!: number;
}
