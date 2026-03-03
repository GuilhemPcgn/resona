import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/supabase-jwt.strategy';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /** Liste les fichiers d'un projet */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('project_id', ParseUUIDPipe) projectId: string,
  ) {
    return this.filesService.findAll(user.id, projectId);
  }

  /** Génère une URL signée de lecture (1h) + peaks/durée si disponibles */
  @Get(':id/url')
  getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.getSignedUrl(id, user.id);
  }

  /**
   * Vérifie les droits, génère le chemin, insère en BDD et retourne
   * une signed URL pour que le frontend uploade directement vers Supabase.
   *
   * Body  : { project_id, filename, mime_type, file_size, name? }
   * Réponse : { file, signedUrl, expiresIn }
   *
   * Le frontend fait ensuite :
   *   PUT signedUrl  —  body: fileBlob, Content-Type: mime_type
   *   POST /files/:id/process  (fire-and-forget)
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  upload(@CurrentUser() user: AuthUser, @Body() dto: UploadFileDto) {
    return this.filesService.upload(user.id, dto);
  }

  /**
   * Déclenche la génération des peaks audio via audiowaveform.
   * Appelé en fire-and-forget par le frontend après l'upload XHR.
   * Met à jour les colonnes `peaks` (JSONB) et `duration` (FLOAT) du fichier.
   *
   * Prérequis : audiowaveform doit être installé sur le serveur.
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  process(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.process(id, user.id);
  }

  /** Supprime un fichier (BDD d'abord, Storage en best-effort) */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.remove(id, user.id);
  }
}
