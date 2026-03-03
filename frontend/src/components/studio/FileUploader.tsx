"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload,
  FileAudio,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchWithAuth } from "@/lib/api-client";

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/ogg",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aac: "audio/aac",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
  };
  return map[ext] ?? "";
}

function fmtSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
}

interface UploadState {
  filename: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface FileUploaderProps {
  selectedProjectId: string;
  onProjectChange: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUploader({
  selectedProjectId,
  onProjectChange,
}: FileUploaderProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetchWithAuth("/projects?limit=100");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
  const projects = projectsData?.data ?? [];

  const uploadFile = async (file: File) => {
    if (!selectedProjectId) {
      toast.error("Sélectionnez un projet avant d'uploader");
      return;
    }

    const mimeType = getMimeType(file);

    // Validation type
    if (!ALLOWED_TYPES.has(mimeType) && !mimeType.startsWith("audio/")) {
      setUploadState({
        filename: file.name,
        progress: 0,
        status: "error",
        error: "Format non supporté. Utilisez MP3, WAV, FLAC, AAC ou OGG.",
      });
      return;
    }

    // Validation taille
    if (file.size > MAX_SIZE) {
      setUploadState({
        filename: file.name,
        progress: 0,
        status: "error",
        error: `Fichier trop lourd (${fmtSize(file.size)}). Limite : 500 MB`,
      });
      return;
    }

    setUploadState({ filename: file.name, progress: 0, status: "uploading" });

    try {
      // Étape 1 — backend génère signed URL + insère en BDD
      const res = await fetchWithAuth("/files/upload", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          filename: file.name,
          mime_type: mimeType,
          file_size: file.size,
        }),
      });
      const { signedUrl, file: fileRecord } = await res.json() as {
        signedUrl: string;
        file: { id: string; name: string };
      };

      // Étape 2 — upload direct vers Supabase Storage avec progression XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadState((prev) =>
              prev ? { ...prev, progress: pct } : prev,
            );
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Erreur Supabase : ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () =>
          reject(new Error("Erreur réseau lors de l'upload")),
        );

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.send(file);
      });

      setUploadState((prev) =>
        prev ? { ...prev, progress: 100, status: "success" } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ["files", selectedProjectId] });
      toast.success(`${file.name} uploadé avec succès`);
      setTimeout(() => setUploadState(null), 3000);

      // Déclenche la génération des peaks en arrière-plan (fire-and-forget)
      fetchWithAuth(`/files/${fileRecord.id}/process`, { method: "POST" }).catch(
        () => {},
      );
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Erreur lors de l'upload";
      setUploadState((prev) =>
        prev ? { ...prev, status: "error", error } : prev,
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const isUploading = uploadState?.status === "uploading";

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-5 space-y-4">
        {/* Sélecteur de projet */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground shrink-0">
            Projet
          </span>
          <Select value={selectedProjectId} onValueChange={onProjectChange}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Sélectionner un projet…" />
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

        {/* Zone de dépôt */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !isUploading && inputRef.current?.click()}
          className={[
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/50 hover:border-primary/50 hover:bg-primary/5",
            isUploading ? "pointer-events-none opacity-60" : "",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={`p-3 rounded-full transition-colors ${
                isDragging ? "bg-primary/20" : "bg-muted/50"
              }`}
            >
              <FileAudio
                className={`w-8 h-8 transition-colors ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging
                  ? "Relâchez pour uploader"
                  : "Glissez un fichier audio ici"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP3, WAV, FLAC, AAC, OGG — 500 MB max
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-border/50 hover:border-primary/40 hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={isUploading}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Sélectionner un fichier
            </Button>
          </div>
        </div>

        {/* État de l'upload */}
        {uploadState && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {uploadState.status === "uploading" && (
                  <Loader2 className="w-4 h-4 text-primary shrink-0 animate-spin" />
                )}
                {uploadState.status === "success" && (
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                )}
                {uploadState.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
                <span className="text-sm text-foreground truncate">
                  {uploadState.filename}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {uploadState.status === "uploading" && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {uploadState.progress}%
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setUploadState(null)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {uploadState.status === "uploading" && (
              <Progress value={uploadState.progress} className="h-1.5" />
            )}

            {uploadState.status === "error" && (
              <p className="text-xs text-destructive">{uploadState.error}</p>
            )}

            {uploadState.status === "success" && (
              <p className="text-xs text-success">Upload terminé avec succès</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
