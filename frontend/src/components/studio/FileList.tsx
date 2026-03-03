"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Download,
  Trash2,
  Music,
  HardDrive,
  Calendar,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { usePlayerStore, selectCurrentTrack, type Track } from "@/store/playerStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fetchWithAuth } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioFile {
  id: string;
  filename: string;
  file_size: number | null;
  file_type: string | null;
  project_id: string;
  file_path: string;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
}

interface FileListProps {
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes: number | null) {
  if (!bytes) return "— MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileList({ selectedProjectId, onProjectChange }: FileListProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Global player store
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const { setQueue, play, toggle } = usePlayerStore();

  // Projets pour le filtre
  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetchWithAuth("/projects?limit=100");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
  const projects = projectsData?.data ?? [];

  // Fichiers du projet sélectionné
  const { data: filesData, isLoading } = useQuery<{
    data: AudioFile[];
    total: number;
  }>({
    queryKey: ["files", selectedProjectId],
    queryFn: async () => {
      const res = await fetchWithAuth(
        `/files?project_id=${selectedProjectId}`,
      );
      return res.json();
    },
    enabled: !!selectedProjectId,
  });
  const files = filesData?.data ?? [];

  // Suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(`/files/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedProjectId] });
      toast.success("Fichier supprimé");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
      setDeleteId(null);
    },
  });

  // Lecture via le GlobalPlayer
  const handleFilePlay = (fileId: string) => {
    const queue: Track[] = files.map((f) => ({ id: f.id, title: f.filename }));
    const startIndex = files.findIndex((f) => f.id === fileId);
    const idx = startIndex >= 0 ? startIndex : 0;

    // If clicking the currently playing track → toggle play/pause
    if (currentTrack?.id === fileId) {
      toggle();
      return;
    }

    // Set the whole project's files as queue and start at this track
    setQueue(queue, idx);
    play();
  };

  // Téléchargement via URL signée
  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloadingId(fileId);
    try {
      const res = await fetchWithAuth(`/files/${fileId}/url`);
      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    } catch {
      toast.error("Impossible de télécharger le fichier");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-foreground">
              Fichiers audio
              {!isLoading && selectedProjectId && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({files.length} fichier{files.length !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>

            <Select
              value={selectedProjectId}
              onValueChange={onProjectChange}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filtrer par projet…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Aucun projet sélectionné */}
          {!selectedProjectId && (
            <div className="py-14 text-center text-muted-foreground">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                Sélectionnez un projet pour voir ses fichiers audio
              </p>
            </div>
          )}

          {/* Chargement */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg"
                >
                  <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          )}

          {/* Projet sans fichiers */}
          {!isLoading && selectedProjectId && files.length === 0 && (
            <div className="py-14 text-center text-muted-foreground">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aucun fichier audio pour ce projet</p>
              <p className="text-xs mt-1 opacity-70">
                Uploadez votre premier fichier ci-dessus
              </p>
            </div>
          )}

          {/* Liste */}
          {!isLoading && files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => {
                const isCurrentTrack = currentTrack?.id === file.id;
                const isActiveAndPlaying = isCurrentTrack && isPlaying;
                return (
                  <div
                    key={file.id}
                    className={[
                      "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                      isCurrentTrack
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/30 hover:border-border/60 hover:bg-muted/20",
                    ].join(" ")}
                  >
                    {/* Bouton play / pause */}
                    <Button
                      variant={isCurrentTrack ? "default" : "outline"}
                      size="sm"
                      className={[
                        "h-9 w-9 p-0 shrink-0",
                        isCurrentTrack
                          ? "bg-primary text-primary-foreground shadow-glow"
                          : "border-border/50 hover:border-primary/40 hover:bg-primary/5",
                      ].join(" ")}
                      onClick={() => handleFilePlay(file.id)}
                    >
                      {isActiveAndPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className={`w-4 h-4 ${isCurrentTrack ? "" : "ml-0.5"}`} />
                      )}
                    </Button>

                    {/* Infos */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrentTrack ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {file.filename}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {fmtSize(file.file_size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(file.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleDownload(file.id, file.filename)}
                        disabled={downloadingId === file.id}
                      >
                        {downloadingId === file.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span className="sr-only">Télécharger</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(file.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation suppression */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le fichier sera définitivement
              supprimé du stockage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
