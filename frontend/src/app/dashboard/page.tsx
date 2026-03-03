"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Calendar,
  DollarSign,
  Music,
  Users,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useStats } from "@/hooks/use-stats";
import { useRecentProjects, useRecentClients, usePendingInvoices } from "@/hooks/use-dashboard-data";
import { fetchWithAuth } from "@/lib/api-client";
import type { Project, Client, Invoice } from "@/hooks/use-dashboard-data";
import type { ProjectFormData } from "@/components/projects/ProjectForm";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays}j`;
}

function mapProjectStatus(
  status: Project["status"],
): "recording" | "mixing" | "mastering" | "completed" {
  const map: Record<Project["status"], "recording" | "mixing" | "mastering" | "completed"> = {
    draft: "recording",
    in_progress: "recording",
    on_hold: "mixing",
    completed: "completed",
    cancelled: "completed",
  };
  return map[status];
}

function mapProjectProgress(status: Project["status"]): number {
  const map: Record<Project["status"], number> = {
    draft: 10,
    in_progress: 50,
    on_hold: 75,
    completed: 100,
    cancelled: 100,
  };
  return map[status];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(delta: number) {
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.round(delta * 100)}%`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PendingInvoicesCard({ invoices, isLoading }: { invoices: Invoice[]; isLoading: boolean }) {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-warning" />
          Factures en attente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune facture en attente
          </p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-3 bg-background/30 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(inv.total_amount)}
                </p>
                {inv.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Échéance {new Date(inv.due_date).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">
                En attente
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentClientsCard({ clients, isLoading }: { clients: Client[]; isLoading: boolean }) {
  const statusColors: Record<Client["status"], string> = {
    active: "bg-success/20 text-success border-success/30",
    vip: "bg-accent/20 text-accent border-accent/30",
    prospect: "bg-primary/20 text-primary border-primary/30",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  const statusLabels: Record<Client["status"], string> = {
    active: "Actif",
    vip: "VIP",
    prospect: "Prospect",
    inactive: "Inactif",
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Derniers clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun client enregistré
          </p>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between p-3 bg-background/30 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{client.name}</p>
                {client.company && (
                  <p className="text-xs text-muted-foreground">{client.company}</p>
                )}
              </div>
              <Badge className={`text-xs border ${statusColors[client.status]}`}>
                {statusLabels[client.status]}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();
  const { data: projectsData, isLoading: projectsLoading } = useRecentProjects();
  const { data: clientsData, isLoading: clientsLoading } = useRecentClients();
  const { data: invoicesData, isLoading: invoicesLoading } = usePendingInvoices();

  const projects = projectsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const pendingInvoices = invoicesData?.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre studio</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-border/50" asChild>
              <Link href="/calendar">
                <Calendar className="w-4 h-4 mr-2" />
                Voir calendrier
              </Link>
            </Button>
            <Button
              className="bg-gradient-hero shadow-glow"
              onClick={() => setSheetOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </div>

        {/* Erreur stats */}
        {statsError && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-destructive text-center">
                Erreur lors du chargement des statistiques.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid — skeleton par carte, pas page entière */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border bg-gradient-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard
                title="Projets actifs"
                value={stats?.activeProjects.toString() || "0"}
                change={`+${stats?.newProjectsThisMonth || 0} ce mois`}
                icon={Music}
                variant="accent"
              />
              <StatsCard
                title="Revenus du mois"
                value={formatCurrency(stats?.monthlyRevenue || 0)}
                change={`${formatPercentage(stats?.revenueDelta || 0)} vs mois dernier`}
                icon={DollarSign}
                variant="success"
              />
              <StatsCard
                title="Séances planifiées"
                value={stats?.sessionsThisWeek.toString() || "0"}
                change="Cette semaine"
                icon={Calendar}
                variant="warning"
              />
              <StatsCard
                title="Clients actifs"
                value={stats?.activeClients.toString() || "0"}
                change={`+${stats?.newClients || 0} nouveaux`}
                icon={Users}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Projets en cours</h2>
              <Button variant="outline" size="sm" className="border-border/50">
                Voir tous les projets
              </Button>
            </div>

            <div className="grid gap-6">
              {projectsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-border bg-gradient-card">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : projects.length === 0 ? (
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    Aucun projet pour le moment.
                  </CardContent>
                </Card>
              ) : (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    artist={project.description || "—"}
                    status={mapProjectStatus(project.status)}
                    progress={mapProjectProgress(project.status)}
                    tracksCount={0}
                    lastActivity={formatRelativeDate(project.created_at)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PendingInvoicesCard invoices={pendingInvoices} isLoading={invoicesLoading} />
            <RecentClientsCard clients={clients} isLoading={clientsLoading} />
            <RecentActivity />
          </div>
        </div>
      </div>
      <ProjectForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        project={null}
        onSubmit={(formData) => {
          const payload: ProjectFormData = {
            ...formData,
            description: formData.description || undefined,
            start_date: formData.start_date || undefined,
            end_date: formData.end_date || undefined,
          };
          createMutation.mutate(payload);
        }}
        isSubmitting={createMutation.isPending}
      />
    </AppLayout>
  );
}
