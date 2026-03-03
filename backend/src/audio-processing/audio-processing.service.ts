import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { supabase } from '../integrations/supabase/client';

const execAsync = promisify(exec);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeaksResult {
  /** Une liste par canal, valeurs interleaved [min0, max0, min1, max1, …] dans [-1, 1] */
  peaks: number[][];
  /** Durée totale en secondes */
  duration: number;
  /** Nombre de canaux audio */
  channels: number;
  /** Fréquence d'échantillonnage */
  sampleRate: number;
}

interface AudiowaveformJson {
  version: number;
  channels: number;
  sample_rate: number;
  samples_per_pixel: number;
  bits: number;
  length: number;
  data: number[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Génère des peaks audio à partir d'un fichier stocké dans Supabase Storage.
 *
 * Prérequis système : audiowaveform (BBC R&D) doit être installé et accessible
 * dans le PATH. Installation : https://github.com/bbc/audiowaveform
 *   - macOS  : brew install audiowaveform
 *   - Ubuntu : voir les instructions du dépôt officiel
 *
 * Flow :
 *   1. Récupère le file_path depuis la BDD
 *   2. Génère une signed URL temporaire (5 min)
 *   3. Streame le fichier vers un fichier temporaire sur disque (pas en RAM)
 *   4. Exécute audiowaveform → JSON 8-bit
 *   5. Normalise les données (÷128 → [-1, 1])
 *   6. Met à jour la BDD (peaks JSONB + duration FLOAT)
 *   7. Nettoie les fichiers temporaires
 */
@Injectable()
export class AudioProcessingService {
  private readonly logger = new Logger(AudioProcessingService.name);

  async generatePeaks(fileId: string, userId: string): Promise<PeaksResult> {
    // ── 1. Récupération de l'enregistrement ───────────────────────────────────
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('id, file_path, mime_type, user_id')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !file) {
      throw new NotFoundException(`Fichier ${fileId} introuvable`);
    }

    // ── 2. URL signée pour télécharger (valide 5 min) ────────────────────────
    const { data: urlData, error: urlError } = await supabase.storage
      .from('audio-files')
      .createSignedUrl(file.file_path, 300);

    if (urlError || !urlData?.signedUrl) {
      throw new InternalServerErrorException(
        "Impossible de générer l'URL de téléchargement pour le traitement",
      );
    }

    // ── 3. Chemins temporaires ────────────────────────────────────────────────
    const tmpDir = os.tmpdir();
    const ext = path.extname(file.file_path) || '.audio';
    const tmpInput = path.join(tmpDir, `resona_${fileId}${ext}`);
    const tmpOutput = path.join(tmpDir, `resona_${fileId}.json`);

    try {
      // ── 4. Téléchargement vers disque (stream HTTPS — aucun byte en RAM) ───
      this.logger.log(`Téléchargement pour peaks: ${file.file_path}`);
      await this.streamToFile(urlData.signedUrl, tmpInput);

      // ── 5. Génération des peaks via audiowaveform ────────────────────────────
      //   --pixels-per-second 20  → ~20 colonnes par seconde (résolution adaptée)
      //   --bits 8                → valeurs signées dans [-128, 127]
      this.logger.log(`Génération des peaks pour ${fileId}`);
      await execAsync(
        `audiowaveform -i "${tmpInput}" -o "${tmpOutput}" --pixels-per-second 20 --bits 8`,
      );

      // ── 6. Parsing et normalisation ──────────────────────────────────────────
      const raw: AudiowaveformJson = JSON.parse(
        fs.readFileSync(tmpOutput, 'utf8'),
      );

      const { data, channels, samples_per_pixel, sample_rate, length: numPixels } = raw;

      //  Format data (bits=8) : pour chaque pixel, 2×channels valeurs
      //  [ min_ch0, max_ch0, min_ch1, max_ch1, … ]  par pixel
      //  Normalisation : diviser par 128 pour obtenir [-1, 1]
      const channelArrays: number[][] = Array.from(
        { length: channels },
        () => [],
      );

      for (let i = 0; i < numPixels; i++) {
        for (let c = 0; c < channels; c++) {
          const base = i * channels * 2 + c * 2;
          channelArrays[c].push(data[base] / 128, data[base + 1] / 128);
        }
      }

      // Durée calculée à partir du nombre de pixels et du ratio
      const duration = (numPixels * samples_per_pixel) / sample_rate;

      // ── 7. Mise à jour BDD ───────────────────────────────────────────────────
      const { error: updateError } = await supabase
        .from('files')
        .update({ peaks: channelArrays, duration })
        .eq('id', fileId);

      if (updateError) {
        // Non bloquant : on retourne quand même le résultat
        this.logger.warn(
          `Impossible de sauvegarder les peaks pour ${fileId}: ${updateError.message}`,
        );
      } else {
        this.logger.log(`Peaks sauvegardées pour ${fileId} (${numPixels} pixels)`);
      }

      return { peaks: channelArrays, duration, channels, sampleRate: sample_rate };
    } finally {
      // ── 8. Nettoyage des fichiers temporaires ────────────────────────────────
      for (const tmpFile of [tmpInput, tmpOutput]) {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // Ignore — le fichier n'existait peut-être pas encore (erreur amont)
        }
      }
    }
  }

  // ── Helper : HTTPS stream vers fichier disque ─────────────────────────────

  private streamToFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            fileStream.destroy();
            fs.unlink(dest, () => {});
            reject(
              new InternalServerErrorException(
                `Échec du téléchargement: HTTP ${res.statusCode}`,
              ),
            );
            return;
          }

          res.pipe(fileStream);

          fileStream.on('finish', () => fileStream.close(() => resolve()));

          fileStream.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
          });
        })
        .on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
    });
  }
}
