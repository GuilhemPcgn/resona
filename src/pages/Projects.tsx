"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Music, 
  Calendar, 
  Clock, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2
} from "lucide-react";

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const projects = [
    {
      id: 1,
      title: "Album Indie Pop",
      artist: "Les Échos Urbains",
      status: "recording",
      progress: 65,
      tracks: 12,
      duration: "3h 24m",
      lastSession: "Aujourd'hui",
      nextSession: "Demain 14h",
      budget: "€3,500",
      spent: "€2,275"
    },
    {
      id: 2,
      title: "EP Rock Alternative", 
      artist: "Neon Shadows",
      status: "mixing",
      progress: 80,
      tracks: 6,
      duration: "1h 45m",
      lastSession: "Hier",
      budget: "€2,000",
      spent: "€1,600"
    },
    {
      id: 3,
      title: "Single Electro",
      artist: "Crystal Dreams",
      status: "mastering",
      progress: 95,
      tracks: 3,
      duration: "45m",
      lastSession: "Il y a 2j",
      budget: "€800",
      spent: "€760"
    }
  ];

  const statusColors = {
    recording: "bg-destructive text-destructive-foreground",
    mixing: "bg-warning text-warning-foreground", 
    mastering: "bg-accent text-accent-foreground",
    completed: "bg-success text-success-foreground"
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projets</h1>
          <p className="text-muted-foreground">Gérez vos projets d'enregistrement</p>
        </div>
        
        <Button className="bg-gradient-hero shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un projet ou artiste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-border/50">
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </div>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/30">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="recording">Enregistrement</TabsTrigger>
          <TabsTrigger value="mixing">Mixage</TabsTrigger>
          <TabsTrigger value="mastering">Mastering</TabsTrigger>
          <TabsTrigger value="completed">Terminés</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="grid gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl text-foreground">{project.title}</CardTitle>
                        <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                          {project.status === 'recording' && 'Enregistrement'}
                          {project.status === 'mixing' && 'Mixage'}
                          {project.status === 'mastering' && 'Mastering'}
                          {project.status === 'completed' && 'Terminé'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{project.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="text-foreground font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{project.tracks} pistes</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{project.duration}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{project.lastSession}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-foreground font-medium">{project.spent}</div>
                      <div className="text-xs text-muted-foreground">sur {project.budget}</div>
                    </div>
                  </div>

                  {/* Next Session */}
                  {project.nextSession && (
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-foreground">Prochaine séance: {project.nextSession}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                        Détails
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;