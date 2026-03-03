"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number) {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  content: z
    .string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(1000, "Maximum 1000 caractères"),
});

type FormData = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CommentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Timecode en secondes (pré-rempli, lecture seule) */
  timestampStart: number;
  onSubmit: (data: { content: string; timestamp_start: number }) => void;
  isSubmitting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommentForm({
  open,
  onOpenChange,
  timestampStart,
  onSubmit,
  isSubmitting,
}: CommentFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { content: "" },
  });

  // Reset le champ à chaque ouverture
  useEffect(() => {
    if (!open) return;
    form.reset({ content: "" });
  }, [open, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({ content: data.content, timestamp_start: timestampStart });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau commentaire</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Timecode en lecture seule */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">Timecode :</span>
              <span className="font-mono font-medium text-foreground">
                {fmtTime(timestampStart)}
              </span>
            </div>

            {/* Contenu */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Votre commentaire…"
                      className="resize-none"
                      rows={3}
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi…" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
