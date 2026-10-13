import { IsString, IsUrl, IsIn, Length } from 'class-validator';

const VALID_EVENTS = [
  'task.created',
  'task.status_changed',
  'task.commented',
  'project.created',
];

export class CreateWebhookDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  @IsIn(VALID_EVENTS)
  event!: string;
}
