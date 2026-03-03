"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Pencil,
  Trash2,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import AppLayout from "@/components/layout/AppLayout";
import { ClientForm } from "@/components/clients/ClientForm";
import { fetchWithAuth } from "@/lib/api-client";
import type { ClientFormData, ClientForEdit } from "@/components/clients/ClientForm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive" | "prospect" | "vip";
  notes?: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Client["status"],
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Actif",
    color: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  vip: {
    label: "VIP",
    color: "bg-accent/15 text-accent border-accent/30",
    dot: "bg-accent",
  },
  prospect: {
    label: "Prospect",
    color: "bg-primary/15 text-primary border-primary/30",
    dot: "bg-primary",
  },
  inactive: {
    label: "Inactif",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ─── Client card ──────────────────────────────────────────────────────────────

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const config = STATUS_CONFIG[client.status];

  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-lg text-foreground truncate">
                {client.name}
              </CardTitle>
              {client.company && (
                <p className="text-sm text-muted-foreground truncate">
                  {client.company}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge className={`text-xs border ${config.color}`}>
              {config.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => onDelete(client.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact */}
        <div className="space-y-2 text-sm">
          {client.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 shrink-0" />
              <a
                href={`mailto:${client.email}`}
                className="truncate hover:text-foreground transition-colors"
              >
                {client.email}
              </a>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 shrink-0" />
              <a
                href={`tel:${client.phone}`}
                className="hover:text-foreground transition-colors"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.company && !client.email && !client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{client.company}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="p-3 bg-muted/30 border border-border/40 rounded-lg">
            <div className="flex items-start gap-2 text-sm">
              <StickyNote className="w-4 h-4 shrink-0 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground line-clamp-2">{client.notes}</p>
            </div>
          </div>
        )}

        {/* No contact info fallback */}
        {!client.email && !client.phone && !client.notes && (
          <p className="text-xs text-muted-foreground italic">
            Aucune information de contact
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {client.email && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5"
              asChild
            >
              <a href={`mailto:${client.email}`}>Contacter</a>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-border/50"
            onClick={() => onEdit(client)}
          >
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClientSkeleton() {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1 rounded" />
          <Skeleton className="h-8 flex-1 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClientForEdit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<{ data: Client[]; total: number }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/clients?limit=50");
      return res.json();
    },
  });
  const clients = data?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (body: ClientFormData) => {
      const res = await fetchWithAuth("/clients", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "clients"] });
      toast.success("Client créé avec succès");
      setSheetOpen(false);
    },
    onError: () => toast.error("Erreur lors de la création du client"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ClientFormData }) => {
      const res = await fetchWithAuth(`/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "clients"] });
      toast.success("Client modifié avec succès");
      setSheetOpen(false);
    },
    onError: () => toast.error("Erreur lors de la modification du client"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(`/clients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "clients"] });
      toast.success("Client supprimé");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du client");
      setDeleteId(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditTarget(client);
    setSheetOpen(true);
  };

  const handleFormSubmit = (formData: ClientFormData) => {
    const payload: ClientFormData = {
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      company: formData.company || undefined,
      notes: formData.notes || undefined,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Gérez votre base de clients</p>
          </div>
          <Button className="bg-gradient-hero shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        {/* Search + compteur */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher par nom, email ou entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
          {!isLoading && (
            <span className="text-sm text-muted-foreground shrink-0">
              {filtered.length} client{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <ClientSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50 bg-gradient-card">
            <CardContent className="py-16 text-center text-muted-foreground">
              {search
                ? "Aucun client ne correspond à votre recherche."
                : "Aucun client pour le moment. Ajoutez votre premier client !"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit sheet */}
      <ClientForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        client={editTarget}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client sera définitivement
              supprimé.
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
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
