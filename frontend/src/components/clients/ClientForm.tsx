"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const clientSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  email: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.string().email("Format d'email invalide").optional(),
  ),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect", "vip"]).optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientForEdit {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  notes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "prospect", label: "Prospect" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Inactif" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientForEdit | null;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting: boolean;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
  isSubmitting,
}: ClientFormProps) {
  const isEdit = !!client;

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      status: "active",
      notes: "",
    },
  });

  // Reset form whenever the sheet opens
  useEffect(() => {
    if (!open) return;
    form.reset({
      name: client?.name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      company: client?.company ?? "",
      status: (client?.status as ClientFormData["status"]) ?? "active",
      notes: client?.notes ?? "",
    });
  }, [open, client, form]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col overflow-hidden">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier le client" : "Nouveau client"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifiez les informations du client puis sauvegardez."
              : "Remplissez les informations pour créer un nouveau client."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden mt-6"
          >
            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Nom */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du client" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemple.com"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Téléphone + Entreprise côte à côte */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+33 6 00 00 00 00"
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
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nom de l'entreprise"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Statut */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "active"}
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
                        className="min-h-[100px] resize-none"
                        {...field}
                        value={field.value ?? ""}
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
                    : "Créer le client"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
