"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Volume2, VolumeX, X, Music, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WaveformPlayer, type WaveformPlayerRef } from "@/components/audio/WaveformPlayer";
import { CommentForm } from "@/components/audio/CommentForm";
import { CommentsPanel } from "@/components/audio/CommentsPanel";
import { fetchWithAuth } from "@/lib/api-client";
import { useComments, useAddComment } from "@/hooks/use-comments";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignedUrlResponse {
  signedUrl: string;
  expiresIn: number;
  /** Peaks précalculées (Phase 2) — null si pas encore générées */
  peaks?: number[][] | null;
  /** Durée en secondes (Phase 2) — null si pas encore générée */
  duration?: number | null;
}

interface AudioPlayerProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
  /** BPM du morceau — alimente l'animation overlay (optionnel) */
  bpm?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AudioPlayer({ fileId, fileName, onClose, bpm }: AudioPlayerProps) {
  const [volume,    setVolume]    = useState(1);
  const [isMuted,   setIsMuted]   = useState(false);

  // Formulaire commentaire
  const [formOpen,        setFormOpen]        = useState(false);
  const [pendingTimestamp, setPendingTimestamp] = useState(0);

  // Ref vers WaveformPlayer pour seekTo / getCurrentTime
  const playerRef = useRef<WaveformPlayerRef>(null);

  // URL signée + peaks — mise en cache 55 min (URL valide 1h)
  const { data: urlData, isLoading } = useQuery<SignedUrlResponse>({
    queryKey: ["file-url", fileId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/files/${fileId}/url`);
      return res.json();
    },
    staleTime: 55 * 60 * 1000,
  });

  // Commentaires (pour les marqueurs sur la waveform)
  const { data: comments = [] } = useComments(fileId);
  const markerTimes = comments
    .map((c) => c.timestamp_start ?? 0)
    .filter((t) => t > 0);

  // Mutation insertion commentaire
  const addMutation = useAddComment(fileId);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVolume = (values: number[]) => {
    const v = values[0];
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => setIsMuted((prev) => !prev);

  /** Double-clic sur la waveform → ouvre le formulaire au timecode cliqué */
  const handleWaveformDblClick = (time: number) => {
    setPendingTimestamp(time);
    setFormOpen(true);
  };

  /** Bouton "Ajouter un commentaire" → ouvre le formulaire à la position courante */
  const handleAddComment = () => {
    const time = playerRef.current?.getCurrentTime() ?? 0;
    setPendingTimestamp(time);
    setFormOpen(true);
  };

  /** Clic sur un timecode dans CommentsPanel → positionne la lecture */
  const handleSeek = (time: number) => {
    playerRef.current?.seekTo(time);
  };

  /** Soumission du formulaire */
  const handleFormSubmit = (data: { content: string; timestamp_start: number }) => {
    addMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Commentaire ajouté");
        setFormOpen(false);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <>
      <Card className="bg-gradient-card border-primary/30 shadow-medium">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Titre + bouton fermer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Music className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {fileName}
                </span>
                {isLoading && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    Chargement…
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Fermer le lecteur</span>
              </Button>
            </div>

            {/* Waveform — montée uniquement quand l'URL signée est disponible */}
            {urlData?.signedUrl && (
              <WaveformPlayer
                ref={playerRef}
                audioUrl={urlData.signedUrl}
                peaks={urlData.peaks ?? undefined}
                duration={urlData.duration ?? undefined}
                volume={isMuted ? 0 : volume}
                height={100}
                bpm={bpm}
                onDoubleClick={handleWaveformDblClick}
                markerTimes={markerTimes}
              />
            )}

            {/* Contrôle de volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolume}
                className="w-24"
              />
            </div>

            {/* ── Section commentaires ── */}
            <Separator className="opacity-50" />

            <div className="space-y-3">
              {/* En-tête + bouton ajout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Commentaires
                    {comments.length > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                        ({comments.length})
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-border/50 gap-1"
                  onClick={handleAddComment}
                  disabled={!urlData?.signedUrl}
                >
                  <Plus className="w-3 h-3" />
                  Ajouter
                </Button>
              </div>

              {/* Liste des commentaires */}
              <CommentsPanel fileId={fileId} onSeek={handleSeek} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire modal — en dehors de la Card pour éviter les conflits de z-index */}
      <CommentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        timestampStart={pendingTimestamp}
        onSubmit={handleFormSubmit}
        isSubmitting={addMutation.isPending}
      />
    </>
  );
}
