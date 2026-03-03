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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceItemsEditor, type InvoiceItem } from "./InvoiceItemsEditor";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  client_id: z.string().uuid("Sélectionnez un client"),
  issue_date: z.string().min(1, "La date d'émission est requise"),
  due_date: z.string().min(1, "La date d'échéance est requise"),
  status: z
    .enum(["draft", "sent", "overdue", "paid", "cancelled"])
    .optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description requise"),
        quantity: z.number().min(0.01, "Quantité > 0"),
        unit_price: z.number().min(0, "Prix ≥ 0"),
      }),
    )
    .min(1, "Au moins une ligne est requise"),
});

const updateSchema = z.object({
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z
    .enum(["draft", "sent", "overdue", "paid", "cancelled"])
    .optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createSchema>;
export type UpdateInvoiceFormData = z.infer<typeof updateSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceForEdit {
  id: string;
  client_id: string;
  client_name?: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
}

interface Client {
  id: string;
  name: string;
  company?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyée" },
  { value: "overdue", label: "En retard" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
] as const;

const EMPTY_ITEM: InvoiceItem = { description: "", quantity: 1, unit_price: 0 };

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: InvoiceForEdit | null;
  onCreateSubmit: (data: CreateInvoiceFormData) => void;
  onUpdateSubmit: (data: UpdateInvoiceFormData) => void;
  isSubmitting: boolean;
}

export function InvoiceForm({
  open,
  onOpenChange,
  invoice,
  onCreateSubmit,
  onUpdateSubmit,
  isSubmitting,
}: InvoiceFormProps) {
  const isEdit = !!invoice;

  // ── Create form ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      client_id: "",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      status: "draft",
      items: [{ ...EMPTY_ITEM }],
    },
  });

  // ── Update form ────────────────────────────────────────────────────────────
  const updateForm = useForm<UpdateInvoiceFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      issue_date: "",
      due_date: "",
      status: "draft",
    },
  });

  // Fetch clients (create mode only)
  const { data: clientsData } = useQuery<{ data: Client[]; total: number }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/clients?limit=100");
      return res.json();
    },
    enabled: open && !isEdit,
    staleTime: 2 * 60 * 1000,
  });
  const clients = clientsData?.data ?? [];

  // Reset on open
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      updateForm.reset({
        issue_date: invoice.issue_date.slice(0, 10),
        due_date: invoice.due_date.slice(0, 10),
        status: invoice.status as UpdateInvoiceFormData["status"],
      });
    } else {
      createForm.reset({
        client_id: "",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: "",
        status: "draft",
        items: [{ ...EMPTY_ITEM }],
      });
    }
  }, [open, invoice, isEdit, createForm, updateForm]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={`${isEdit ? "sm:max-w-lg" : "sm:max-w-3xl"} flex flex-col overflow-hidden`}
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Modifier la facture" : "Nouvelle facture"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `${invoice.client_name ?? "Client"} — ${fmtCurrency(invoice.total_amount)}`
              : "Remplissez les informations pour créer une nouvelle facture."}
          </SheetDescription>
        </SheetHeader>

        {isEdit ? (
          /* ── Edit mode ───────────────────────────────────────────────────── */
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
              className="flex flex-col flex-1 overflow-hidden mt-6"
            >
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                <FormField
                  control={updateForm.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;émission</FormLabel>
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
                  control={updateForm.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;échéance</FormLabel>
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
                  control={updateForm.control}
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
              </div>

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
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        ) : (
          /* ── Create mode ─────────────────────────────────────────────────── */
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              className="flex flex-col flex-1 overflow-hidden mt-6"
            >
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Client */}
                <FormField
                  control={createForm.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d&apos;émission *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d&apos;échéance *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Statut */}
                <FormField
                  control={createForm.control}
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

                {/* Lignes */}
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-none">Lignes *</p>
                  <FormField
                    control={createForm.control}
                    name="items"
                    render={({ field, fieldState }) => (
                      <InvoiceItemsEditor
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
              </div>

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
                  {isSubmitting ? "Création..." : "Créer la facture"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
