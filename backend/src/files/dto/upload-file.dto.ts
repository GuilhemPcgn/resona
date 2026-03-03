import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class UploadFileDto {
  @IsUUID()
  project_id: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mime_type: string;

  @IsNumber()
  @Min(0)
  file_size: number;

  /** Nom d'affichage optionnel (par défaut : filename) */
  @IsOptional()
  @IsString()
  name?: string;
}
