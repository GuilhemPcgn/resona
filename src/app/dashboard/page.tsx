"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Music, 
  Users,
  TrendingUp,
  Clock,
  FileAudio
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

const queryClient = new QueryClient();

export default function Dashboard() {
  const projects = [
    {
      id: "1",
      title: "Album Indie Pop",
      artist: "Les Échos Urbains",
      status: "recording" as const,
      progress: 65,
      nextSession: "Demain 14h",
      tracksCount: 12,
      lastActivity: "Aujourd'hui"
    },
    {
      id: "2",
      title: "EP Rock Alternative",
      artist: "Neon Shadows",
      status: "mixing" as const,
      progress: 80,
      tracksCount: 6,
      lastActivity: "Hier"
    },
    {
      id: "3",
      title: "Single Electro",
      artist: "Crystal Dreams",
      status: "mastering" as const,
      progress: 95,
      tracksCount: 3,
      lastActivity: "Il y a 2j"
    }
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-muted-foreground">Vue d'ensemble de votre studio</p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" className="border-border/50">
                  <Calendar className="w-4 h-4 mr-2" />
                  Voir calendrier
                </Button>
                <Button className="bg-gradient-hero shadow-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau projet
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Projets actifs"
                value="8"
                change="+2 ce mois"
                icon={Music}
                variant="accent"
              />
              <StatsCard
                title="Revenus du mois"
                value="€4,890"
                change="+12% vs mois dernier"
                icon={DollarSign}
                variant="success"
              />
              <StatsCard
                title="Séances planifiées"
                value="12"
                change="Cette semaine"
                icon={Calendar}
                variant="warning"
              />
              <StatsCard
                title="Clients actifs"
                value="15"
                change="+3 nouveaux"
                icon={Users}
                variant="default"
              />
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
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      {...project}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-foreground">Aperçu rapide</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileAudio className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Fichiers uploadés</p>
                          <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary">24</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Clock className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Heures studio</p>
                          <p className="text-xs text-muted-foreground">Cette semaine</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-success">32h</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Taux d'occupation</p>
                          <p className="text-xs text-muted-foreground">Studio A</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-warning">85%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <RecentActivity />
              </div>
            </div>
          </div>
        </AppLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
