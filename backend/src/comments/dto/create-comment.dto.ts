import { IsString, IsNumber, IsOptional, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  file_id: string;

  @IsString()
  @MaxLength(1000)
  content: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timestamp_start?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timestamp_end?: number;
}
