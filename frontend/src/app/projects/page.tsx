"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/layout/AppLayout";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { fetchWithAuth } from "@/lib/api-client";
import type { ProjectFormData, ProjectForEdit } from "@/components/projects/ProjectForm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  status: "draft" | "in_progress" | "on_hold" | "completed" | "cancelled";
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at: string;
}

type TabValue = "all" | "draft" | "in_progress" | "on_hold" | "completed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Project["status"],
  { label: string; color: string }
> = {
  draft: {
    label: "Brouillon",
    color: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    label: "En cours",
    color: "bg-destructive/15 text-destructive border-destructive/30",
  },
  on_hold: {
    label: "En pause",
    color: "bg-warning/15 text-warning border-warning/30",
  },
  completed: {
    label: "Terminé",
    color: "bg-success/15 text-success border-success/30",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-muted text-muted-foreground border-border",
  },
};

const PROGRESS_BY_STATUS: Record<Project["status"], number> = {
  draft: 10,
  in_progress: 50,
  on_hold: 75,
  completed: 100,
  cancelled: 100,
};

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "in_progress", label: "En cours" },
  { value: "on_hold", label: "En pause" },
  { value: "completed", label: "Terminés" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Project card ─────────────────────────────────────────────────────────────

interface ProjectCardItemProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

function ProjectCardItem({ project, onEdit, onDelete }: ProjectCardItemProps) {
  const config = STATUS_CONFIG[project.status];
  const progress = PROGRESS_BY_STATUS[project.status];

  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-xl text-foreground">
                {project.title}
              </CardTitle>
              <Badge className={`text-xs border ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Details row */}
        {(project.start_date || project.end_date || project.budget) && (
          <div className="flex items-center gap-5 text-sm flex-wrap">
            {(project.start_date || project.end_date) && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  {formatDate(project.start_date) ?? "—"}
                  {project.end_date
                    ? ` → ${formatDate(project.end_date)}`
                    : ""}
                </span>
              </div>
            )}
            {project.budget != null && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-4 h-4 shrink-0" />
                <span>{formatCurrency(project.budget)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function ProjectSkeleton() {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectForEdit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<{ data: Project[]; total: number }>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetchWithAuth("/projects?limit=50");
      return res.json();
    },
  });
  const projects = data?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (body: ProjectFormData) => {
      const res = await fetchWithAuth("/projects", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "projects"] });
      toast.success("Projet créé avec succès");
      setSheetOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Erreur lors de la création du projet"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: ProjectFormData }) => {
      const res = await fetchWithAuth(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "projects"] });
      toast.success("Projet modifié avec succès");
      setSheetOpen(false);
    },
    onError: () => toast.error("Erreur lors de la modification du projet"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(`/projects/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "projects"] });
      toast.success("Projet supprimé");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du projet");
      setDeleteId(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditTarget(project);
    setSheetOpen(true);
  };

  const handleFormSubmit = (formData: ProjectFormData) => {
    // Clean empty strings before sending
    const payload: ProjectFormData = {
      ...formData,
      description: formData.description || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.title.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q);
    const matchTab =
      activeTab === "all" ||
      (activeTab === "completed"
        ? p.status === "completed" || p.status === "cancelled"
        : p.status === activeTab);
    return matchSearch && matchTab;
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projets</h1>
            <p className="text-muted-foreground">
              Gérez vos projets d'enregistrement
            </p>
          </div>
          <Button className="bg-gradient-hero shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un projet ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-background/50 border-border/50"
            />
          </div>
          <Button variant="outline" className="border-border/50" disabled>
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList className="bg-muted/30">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.value !== "all" && !isLoading && (
                  <span className="ml-1.5 text-xs opacity-60">
                    (
                    {
                      projects.filter((p) =>
                        tab.value === "completed"
                          ? p.status === "completed" || p.status === "cancelled"
                          : p.status === tab.value,
                      ).length
                    }
                    )
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Project list */}
        {isLoading ? (
          <div className="grid gap-6">
            <ProjectSkeleton />
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50 bg-gradient-card">
            <CardContent className="py-16 text-center text-muted-foreground">
              {search || activeTab !== "all"
                ? "Aucun projet ne correspond à votre recherche."
                : "Aucun projet pour le moment. Créez votre premier projet !"}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filtered.map((project) => (
              <ProjectCardItem
                key={project.id}
                project={project}
                onEdit={openEdit}
                onDelete={setDeleteId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit sheet */}
      <ProjectForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        project={editTarget}
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
            <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet sera définitivement
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
