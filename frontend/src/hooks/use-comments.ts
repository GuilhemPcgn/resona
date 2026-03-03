import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  file_id: string;
  user_id: string;
  content: string;
  timestamp_start: number | null;
  timestamp_end: number | null;
  is_resolved: boolean | null;
  created_at: string;
  updated_at: string;
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

export function useComments(fileId: string) {
  return useQuery<Comment[]>({
    queryKey: ["comments", fileId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/comments?file_id=${fileId}`);
      return res.json();
    },
    enabled: !!fileId,
  });
}

// ─── Insertion ────────────────────────────────────────────────────────────────

export function useAddComment(fileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      content,
      timestamp_start,
    }: {
      content: string;
      timestamp_start: number;
    }) => {
      const res = await fetchWithAuth("/comments", {
        method: "POST",
        body: JSON.stringify({ file_id: fileId, content, timestamp_start }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", fileId] });
    },
  });
}

// ─── Résolution ───────────────────────────────────────────────────────────────

export function useToggleResolved(fileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      is_resolved,
    }: {
      id: string;
      is_resolved: boolean;
    }) => {
      const res = await fetchWithAuth(`/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_resolved }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", fileId] });
    },
  });
}

// ─── Suppression ──────────────────────────────────────────────────────────────

export function useDeleteComment(fileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await fetchWithAuth(`/comments/${commentId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", fileId] });
    },
  });
}
