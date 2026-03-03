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

const SESSION_TYPES = ["mixing", "recording", "mastering", "production", "editing", "meeting"] as const;
type SessionTypeValue = (typeof SESSION_TYPES)[number];

const SESSION_TYPE_LABELS: Record<SessionTypeValue, string> = {
  mixing: "Mixage",
  recording: "Prise voix",
  mastering: "Mastering",
  production: "Prod/Beatmaking",
  editing: "Montage",
  meeting: "Réunion",
};

const SESSION_LOCATIONS = ["studio", "remote", "on_site"] as const;
type SessionLocationValue = (typeof SESSION_LOCATIONS)[number];

const SESSION_LOCATION_LABELS: Record<SessionLocationValue, string> = {
  studio: "Studio",
  remote: "À distance",
  on_site: "Sur place",
};

const SESSION_STATUSES = ["pending", "confirmed", "paid", "cancelled"] as const;
type SessionStatusValue = (typeof SESSION_STATUSES)[number];

const SESSION_STATUS_LABELS: Record<SessionStatusValue, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
};

const sessionSchema = z
  .object({
    title: z.string().min(1, "Le titre est requis").max(255),
    session_type: z.enum(SESSION_TYPES, { required_error: "Le type est requis" }),
    location: z.preprocess(
      (v) => (v === "" || v === "__none__" || v === undefined ? undefined : v),
      z.enum(SESSION_LOCATIONS).optional(),
    ),
    project_id: z.string().uuid("Projet invalide").min(1, "Le projet est requis"),
    client_id: z.preprocess(
      (v) => (v === "" || v === "__none__" || v === undefined ? undefined : v),
      z.string().uuid().optional(),
    ),
    start_date: z.string().min(1, "La date de début est requise"),
    end_date: z.string().min(1, "La date de fin est requise"),
    hourly_rate: z.preprocess(
      (v) =>
        v === "" || v === null || v === undefined ? undefined : Number(v),
      z.number().min(0).optional(),
    ),
    notes: z.string().optional(),
    status: z.enum(SESSION_STATUSES).optional().default("pending"),
  })
  .refine((d) => !d.start_date || !d.end_date || d.end_date > d.start_date, {
    message: "La date de fin doit être après la date de début",
    path: ["end_date"],
  });

export type SessionFormData = z.infer<typeof sessionSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionForEdit {
  id: string;
  title: string;
  session_type: SessionTypeValue;
  location?: SessionLocationValue;
  status?: SessionStatusValue;
  project_id: string;
  client_id?: string;
  start_date: string;
  end_date: string;
  hourly_rate?: number;
  notes?: string;
}

interface Project {
  id: string;
  title: string;
}
interface Client {
  id: string;
  name: string;
  company?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ISO string or datetime-local string to "YYYY-MM-DDTHH:MM" for input value */
function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SessionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: SessionForEdit | null;
  /** Pre-filled start datetime (YYYY-MM-DDTHH:MM) when creating from a calendar click */
  defaultStart?: string;
  onSubmit: (data: SessionFormData) => void;
  isSubmitting: boolean;
}

export function SessionForm({
  open,
  onOpenChange,
  session,
  defaultStart,
  onSubmit,
  isSubmitting,
}: SessionFormProps) {
  const isEdit = !!session;

  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      session_type: "mixing",
      location: undefined,
      status: "pending" as SessionStatusValue,
      project_id: "",
      client_id: undefined,
      start_date: "",
      end_date: "",
      hourly_rate: undefined,
      notes: "",
    },
  });

  // Fetch projects + clients for selects (only when sheet is open)
  const { data: projectsData } = useQuery<{ data: Project[]; total: number }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetchWithAuth("/projects?limit=100");
      return res.json();
    },
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const { data: clientsData } = useQuery<{ data: Client[]; total: number }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/clients?limit=100");
      return res.json();
    },
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const projects = projectsData?.data ?? [];
  const clients = clientsData?.data ?? [];

  // Build default end from defaultStart (+1h)
  const defaultEnd = (() => {
    if (!defaultStart) return "";
    const d = new Date(defaultStart);
    d.setHours(d.getHours() + 1);
    return toLocalInput(d.toISOString());
  })();

  // Reset form on open
  useEffect(() => {
    if (!open) return;
    form.reset({
      title: session?.title ?? "",
      session_type: session?.session_type ?? "mixing",
      location: session?.location ?? undefined,
      status: (session?.status ?? "pending") as SessionStatusValue,
      project_id: session?.project_id ?? "",
      client_id: session?.client_id ?? undefined,
      start_date: session ? toLocalInput(session.start_date) : (defaultStart ?? ""),
      end_date: session ? toLocalInput(session.end_date) : defaultEnd,
      hourly_rate: session?.hourly_rate ?? undefined,
      notes: session?.notes ?? "",
    });
  }, [open, session, defaultStart, defaultEnd, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader className="pb-1 pt-1">
          <SheetTitle className="text-sm">
            {isEdit ? "Modifier la séance" : "Nouvelle séance"}
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden mt-2"
          >
            <div className="flex-1 overflow-y-auto space-y-2 px-1">
              {/* Titre */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de la séance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type de séance */}
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de séance *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {SESSION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Statut */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "pending"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SESSION_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SESSION_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Localisation */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "__none__" ? undefined : v)
                      }
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une localisation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Non précisée</SelectItem>
                        {SESSION_LOCATIONS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {SESSION_LOCATION_LABELS[l]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Projet */}
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projet *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Début *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
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
                      <FormLabel>Fin *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tarif horaire */}
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarif horaire (€/h)</FormLabel>
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

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations complémentaires..."
                        className="min-h-[80px] resize-none"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="pt-3 mt-3 border-t border-border/50 gap-2 shrink-0">
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
                    : "Créer la séance"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
