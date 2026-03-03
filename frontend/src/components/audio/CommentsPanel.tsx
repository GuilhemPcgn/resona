"use client";

import { Check, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useComments,
  useDeleteComment,
  useToggleResolved,
  type Comment,
} from "@/hooks/use-comments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number | null) {
  if (s === null || !isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommentsPanelProps {
  fileId: string;
  /** Appelé quand l'utilisateur clique sur un timecode — positionne le lecteur */
  onSeek: (time: number) => void;
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  onSeek,
  onDelete,
  onToggle,
}: {
  comment: Comment;
  onSeek: (t: number) => void;
  onDelete: (id: string) => void;
  onToggle: (comment: Comment) => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        comment.is_resolved
          ? "bg-muted/20 border-border/20 opacity-60"
          : "bg-background/30 border-border/50 hover:border-border"
      }`}
    >
      {/* Timecode cliquable */}
      <button
        onClick={() => onSeek(comment.timestamp_start ?? 0)}
        title="Aller à ce timecode"
        className="font-mono text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors shrink-0 mt-0.5"
      >
        {fmtTime(comment.timestamp_start)}
      </button>

      {/* Contenu */}
      <p
        className={`flex-1 text-sm leading-relaxed ${
          comment.is_resolved
            ? "line-through text-muted-foreground"
            : "text-foreground"
        }`}
      >
        {comment.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onToggle(comment)}
          title={comment.is_resolved ? "Marquer non résolu" : "Marquer résolu"}
          className={`p-1.5 rounded transition-colors ${
            comment.is_resolved
              ? "text-green-500 hover:text-green-400"
              : "text-muted-foreground hover:text-green-500"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(comment.id)}
          title="Supprimer"
          className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommentsPanel({ fileId, onSeek }: CommentsPanelProps) {
  const { data: comments = [], isLoading } = useComments(fileId);
  const deleteMutation = useDeleteComment(fileId);
  const toggleMutation = useToggleResolved(fileId);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Commentaire supprimé"),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const handleToggle = (comment: Comment) => {
    toggleMutation.mutate(
      { id: comment.id, is_resolved: !comment.is_resolved },
      { onError: (err: Error) => toast.error(err.message) },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-6 w-12 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Aucun commentaire — double-cliquez sur la waveform ou utilisez le
        bouton ci-dessus.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentRow
          key={comment.id}
          comment={comment}
          onSeek={onSeek}
          onDelete={handleDelete}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
