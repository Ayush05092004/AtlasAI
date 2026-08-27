import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum InviteRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(InviteRole)
  role?: InviteRole;
}

export class AcceptInviteDto {
  @IsString()
  token!: string;
}
