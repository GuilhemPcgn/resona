import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';
import { AudioProcessingService } from '../audio-processing/audio-processing.service';
import { ProjectProgressService } from '../projects/project-progress.service';
import type { UploadFileDto } from './dto/upload-file.dto';

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/ogg',
]);

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly audioProcessing: AudioProcessingService,
    private readonly projectProgress: ProjectProgressService,
  ) {}

  // ── Liste ────────────────────────────────────────────────────────────────────

  async findAll(userId: string, projectId: string) {
    await this.assertProjectOwner(userId, projectId);

    const { data, error, count } = await supabase
      .from('files')
      .select('*', { count: 'exact' })
      .eq('uploaded_by', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  // ── URL de téléchargement + peaks ────────────────────────────────────────────

  /**
   * Génère une signed URL de lecture (1h) et retourne les peaks/durée
   * si elles ont déjà été calculées (Phase 2), sinon null.
   */
  async getSignedUrl(fileId: string, userId: string) {
    const file = await this.findOneOrFail(fileId, userId);

    const { data, error } = await supabase.storage
      .from('audio-files')
      .createSignedUrl(file.file_path, 3600);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        "Impossible de générer l'URL de téléchargement",
      );
    }

    return {
      signedUrl: data.signedUrl,
      expiresIn: 3600,
      // Peaks précalculées — null si pas encore générées (Phase 2)
      peaks: (file.peaks as number[][] | null) ?? null,
      duration: (file.duration as number | null) ?? null,
    };
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  /**
   * Le backend vérifie les droits, génère le chemin de stockage,
   * insère le record en BDD et retourne une signed URL.
   * Le frontend envoie ensuite le fichier en PUT directement sur Supabase —
   * le serveur Node ne touche jamais au binaire.
   *
   * Flow frontend :
   *   const { file, signedUrl } = await POST /files/upload  { project_id, filename, … }
   *   await fetch(signedUrl, { method: 'PUT', body: fileBlob })
   *   await POST /files/:id/process  (fire-and-forget)
   */
  async upload(userId: string, dto: UploadFileDto) {
    // 1. Vérification ownership + MIME
    this.assertMimeType(dto.mime_type);
    await this.assertProjectOwner(userId, dto.project_id);

    // 2. Génération du chemin de stockage
    const timestamp = Date.now();
    const sanitized = dto.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${dto.project_id}/${timestamp}_${sanitized}`;

    // 3. Signed upload URL (vers Supabase Storage, valide 1h)
    const { data: uploadData, error: urlError } = await supabase.storage
      .from('audio-files')
      .createSignedUploadUrl(storagePath);

    if (urlError || !uploadData) {
      throw new InternalServerErrorException(
        "Impossible de générer l'URL d'upload",
      );
    }

    // 4. Insertion en BDD
    const { data: file, error: dbError } = await supabase
      .from('files')
      .insert({
        uploaded_by: userId,
        project_id: dto.project_id,
        filename: dto.name ?? dto.filename,
        original_filename: dto.filename,
        file_path: storagePath,
        file_size: dto.file_size,
        file_type: dto.mime_type,
      })
      .select()
      .single();

    if (dbError) {
      throw new InternalServerErrorException(
        `Erreur lors de l'enregistrement en base : ${dbError.message}`,
      );
    }

    void this.projectProgress.recalculate(dto.project_id);
    return {
      file,
      signedUrl: uploadData.signedUrl,
      expiresIn: 3600,
    };
  }

  // ── Génération des peaks (Phase 2) ───────────────────────────────────────────

  /**
   * Déclenche la génération des peaks via audiowaveform.
   * Met à jour les colonnes `peaks` et `duration` dans la BDD.
   * Appelé en fire-and-forget par le frontend après l'upload XHR.
   */
  async process(fileId: string, userId: string) {
    return this.audioProcessing.generatePeaks(fileId, userId);
  }

  // ── Suppression ──────────────────────────────────────────────────────────────

  async remove(fileId: string, userId: string) {
    const file = await this.findOneOrFail(fileId, userId);

    // BDD en premier — pas de référence orpheline possible
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('uploaded_by', userId);

    if (dbError) throw dbError;

    // Storage en best-effort — si ça échoue, log + orphan nettoyable manuellement
    const { error: storageError } = await supabase.storage
      .from('audio-files')
      .remove([file.file_path]);

    if (storageError) {
      this.logger.warn(
        `Fichier orphelin dans le bucket : ${file.file_path} — ${storageError.message}`,
      );
    }

    void this.projectProgress.recalculate(file.project_id as string);
  }

  // ── Helpers privés ───────────────────────────────────────────────────────────

  private assertMimeType(mimeType: string) {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Type MIME non supporté : ${mimeType}. ` +
          `Formats acceptés : ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }
  }

  private async findOneOrFail(fileId: string, userId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('uploaded_by', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Fichier ${fileId} introuvable`);
    }
    return data;
  }

  private async assertProjectOwner(userId: string, projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new ForbiddenException(
        `Projet ${projectId} introuvable ou accès refusé`,
      );
    }
  }
}
