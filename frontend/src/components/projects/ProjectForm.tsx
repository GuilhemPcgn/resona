"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const projectSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().optional(),
  client_id: z.preprocess(
    (v) => (v === "" || v === "__none__" || v === undefined ? undefined : v),
    z.string().uuid().optional(),
  ),
  status: z
    .enum(["draft", "in_progress", "on_hold", "completed", "cancelled"])
    .optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined ? undefined : Number(v),
    z.number().min(0).optional(),
  ),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  company?: string;
}

export interface ProjectForEdit {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "in_progress", label: "En cours" },
  { value: "on_hold", label: "En pause" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectForEdit | null;
  onSubmit: (data: ProjectFormData) => void;
  isSubmitting: boolean;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  onSubmit,
  isSubmitting,
}: ProjectFormProps) {
  const isEdit = !!project;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: undefined,
      status: "draft",
      start_date: "",
      end_date: "",
      budget: undefined,
    },
  });

  // Fetch clients for the dropdown (only when sheet is open)
  const { data: clientsData } = useQuery<{ data: Client[]; total: number }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/clients?limit=100");
      return res.json();
    },
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });
  const clients = clientsData?.data ?? [];

  // Reset form whenever the sheet opens (populate for edit, clear for create)
  useEffect(() => {
    if (!open) return;
    form.reset({
      title: project?.title ?? "",
      description: project?.description ?? "",
      client_id: project?.client_id ?? undefined,
      status:
        (project?.status as ProjectFormData["status"]) ?? "draft",
      start_date: project?.start_date?.slice(0, 10) ?? "",
      end_date: project?.end_date?.slice(0, 10) ?? "",
      budget: project?.budget ?? undefined,
    });
  }, [open, project, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier le projet" : "Nouveau projet"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifiez les informations du projet puis sauvegardez."
              : "Remplissez les informations pour créer un nouveau projet."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden mt-6"
          >
            {/* Scrollable fields area */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du projet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description du projet..."
                        className="min-h-[80px] resize-none"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? undefined : v)
                      }
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Aucun client</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.company ? ` — ${c.company}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "draft"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Budget */}
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : e.target.valueAsNumber,
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sticky footer */}
            <SheetFooter className="pt-4 mt-4 border-t border-border/50 gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-gradient-hero shadow-glow"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEdit
                    ? "Enregistrement..."
                    : "Création..."
                  : isEdit
                    ? "Enregistrer"
                    : "Créer le projet"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
