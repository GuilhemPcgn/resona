import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';

export enum SessionType {
  RECORDING = 'recording',
  MIXING = 'mixing',
  MASTERING = 'mastering',
  PRODUCTION = 'production',
  EDITING = 'editing',
  MEETING = 'meeting',
}

export enum SessionLocation {
  STUDIO = 'studio',
  REMOTE = 'remote',
  ON_SITE = 'on_site',
}

export enum SessionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class CreateSessionDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(SessionType)
  session_type: SessionType;

  @IsOptional()
  @IsEnum(SessionLocation)
  location?: SessionLocation;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
