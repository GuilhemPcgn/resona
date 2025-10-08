"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Music, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

const Clients = () => {
  const clients = [
    {
      id: 1,
      name: "Sophie Martin",
      company: "Les Échos Urbains",
      email: "sophie@echosurbains.fr",
      phone: "+33 6 12 34 56 78",
      location: "Paris, France",
      projectsCount: 3,
      totalSpent: 4890,
      lastProject: "Album Indie Pop",
      status: "active",
      avatar: "SM"
    },
    {
      id: 2,
      name: "Alex Rivera", 
      company: "Neon Shadows",
      email: "alex@neonshadows.com",
      phone: "+33 6 87 65 43 21",
      location: "Lyon, France",
      projectsCount: 2,
      totalSpent: 3200,
      lastProject: "EP Rock Alternative",
      status: "active",
      avatar: "AR"
    },
    {
      id: 3,
      name: "Emma Dubois",
      company: "Crystal Dreams",
      email: "emma@crystaldreams.fr", 
      phone: "+33 6 99 88 77 66",
      location: "Marseille, France",
      projectsCount: 1,
      totalSpent: 760,
      lastProject: "Single Electro",
      status: "completed",
      avatar: "ED"
    }
  ];

  const statusColors = {
    active: "bg-success text-success-foreground",
    inactive: "bg-muted text-muted-foreground",
    completed: "bg-accent text-accent-foreground"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Gérez votre base de clients</p>
        </div>
        
        <Button className="bg-gradient-hero shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un client..."
          className="pl-10 bg-background/50 border-border/50"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <Card key={client.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {client.avatar}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <CardTitle className="text-lg text-foreground">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                </div>
                
                <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                  {client.status === 'active' ? 'Actif' : 
                   client.status === 'completed' ? 'Terminé' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{client.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Music className="w-4 h-4" />
                    <span className="font-semibold">{client.projectsCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Projets</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">€{client.totalSpent.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-accent">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-xs">Récent</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Activité</p>
                </div>
              </div>

              {/* Last Project */}
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-sm">
                  <span className="text-muted-foreground">Dernier projet:</span>
                  <div className="font-medium text-primary">{client.lastProject}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-border/50 hover:border-primary/30 hover:bg-primary/5">
                  Voir projets
                </Button>
                <Button size="sm" className="flex-1 bg-primary">
                  Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clients;