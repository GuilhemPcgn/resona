import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';

/**
 * Calcule et persiste la progression automatique d'un projet (0-100).
 *
 * Pondération :
 *   40 % → séances confirmées (is_confirmed = true) / total séances
 *   40 % → présence d'au moins un fichier audio
 *   20 % → au moins une facture avec status = 'paid'
 *
 * Usage (fire-and-forget) :
 *   void this.projectProgress.recalculate(projectId);
 */
@Injectable()
export class ProjectProgressService {
  private readonly logger = new Logger(ProjectProgressService.name);

  async calculateProgress(projectId: string): Promise<number> {
    // Requêtes en parallèle pour minimiser la latence
    const [
      { count: totalSessions },
      { count: confirmedSessions },
      { count: fileCount },
      { count: paidInvoices },
    ] = await Promise.all([
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),
      supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('is_confirmed', true),
      supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'paid'),
    ]);

    const total = totalSessions ?? 0;
    const confirmed = confirmedSessions ?? 0;

    // 40 % séances — division par zéro impossible grâce au guard total > 0
    const sessionScore = total > 0 ? (confirmed / total) * 40 : 0;

    // 40 % fichiers audio — binaire
    const fileScore = (fileCount ?? 0) > 0 ? 40 : 0;

    // 20 % facture payée — binaire
    const invoiceScore = (paidInvoices ?? 0) > 0 ? 20 : 0;

    return Math.round(sessionScore + fileScore + invoiceScore);
  }

  /**
   * Recalcule la progression et la persiste dans projects.progress.
   * Conçu pour être appelé en fire-and-forget : void this.recalculate(id)
   */
  async recalculate(projectId: string): Promise<void> {
    try {
      const progress = await this.calculateProgress(projectId);

      const { error } = await supabase
        .from('projects')
        .update({ progress })
        .eq('id', projectId);

      if (error) {
        this.logger.warn(
          `Échec de la mise à jour progress pour le projet ${projectId} : ${error.message}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Erreur lors du recalcul de progression du projet ${projectId} : ${String(err)}`,
      );
    }
  }
}
