import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Plus, Music, Calendar, DollarSign, Users, TrendingUp, Clock } from "lucide-react";

const Index = () => {
  const projects = [
    {
      id: "1",
      title: "Album Indie Pop",
      artist: "Les Échos Urbains",
      status: "recording" as const,
      progress: 65,
      nextSession: "Demain 14h",
      tracksCount: 12,
      lastActivity: "Il y a 2h"
    },
    {
      id: "2", 
      title: "EP Rock Alternative",
      artist: "Neon Shadows",
      status: "mixing" as const,
      progress: 80,
      tracksCount: 6,
      lastActivity: "Il y a 1j"
    },
    {
      id: "3",
      title: "Single Electro",
      artist: "Crystal Dreams",
      status: "mastering" as const,
      progress: 95,
      tracksCount: 3,
      lastActivity: "Il y a 3h"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Aperçu de votre activité studio
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-border/50">
            <Calendar className="w-4 h-4 mr-2" />
            Calendrier
          </Button>
          <Button className="bg-gradient-hero shadow-glow hover:shadow-accent-glow transition-all duration-300">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Projets actifs"
          value="12"
          change="+2 ce mois"
          icon={Music}
          variant="accent"
        />
        <StatsCard
          title="Séances cette semaine"
          value="8"
          change="Planning chargé"
          icon={Calendar}
          variant="default"
        />
        <StatsCard
          title="Revenus ce mois"
          value="€4,890"
          change="+12% vs mois dernier"
          icon={DollarSign}
          variant="success"
        />
        <StatsCard
          title="Clients actifs"
          value="24"
          change="5 nouveaux"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Projets en cours
            </h2>
            <Button variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
              Voir tout
            </Button>
          </div>
          
          <div className="grid gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </div>

        {/* Activity Sidebar */}
        <div className="space-y-6">
          <RecentActivity />
          
          {/* Quick Actions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Actions rapides</h3>
            
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 border-border/50 hover:border-primary/30 hover:bg-primary/5"
              >
                <Plus className="w-4 h-4 mr-3 text-accent" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Nouvelle séance</div>
                  <div className="text-xs text-muted-foreground">Programmer un rdv</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 border-border/50 hover:border-primary/30 hover:bg-primary/5"
              >
                <Music className="w-4 h-4 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Upload audio</div>
                  <div className="text-xs text-muted-foreground">Partager un fichier</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4 border-border/50 hover:border-primary/30 hover:bg-primary/5"
              >
                <DollarSign className="w-4 h-4 mr-3 text-success" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Créer facture</div>
                  <div className="text-xs text-muted-foreground">Nouveau devis</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
