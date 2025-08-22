"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Music
} from "lucide-react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');

  // Mock sessions data
  const sessions = [
    {
      id: 1,
      title: "Enregistrement - Les Échos Urbains",
      type: "recording",
      time: "14:00 - 18:00",
      studio: "Studio A",
      client: "Sophie Martin",
      status: "confirmed"
    },
    {
      id: 2,
      title: "Mixage - Neon Shadows",
      type: "mixing", 
      time: "10:00 - 13:00",
      studio: "Studio B",
      client: "Alex Rivera",
      status: "pending"
    },
    {
      id: 3,
      title: "Mastering - Crystal Dreams",
      type: "mastering",
      time: "15:00 - 17:00", 
      studio: "Studio C",
      client: "Emma Dubois",
      status: "confirmed"
    }
  ];

  const sessionTypes = {
    recording: { label: "Enregistrement", color: "bg-destructive text-destructive-foreground" },
    mixing: { label: "Mixage", color: "bg-warning text-warning-foreground" },
    mastering: { label: "Mastering", color: "bg-accent text-accent-foreground" }
  };

  const statusColors = {
    confirmed: "bg-success text-success-foreground",
    pending: "bg-warning text-warning-foreground",
    cancelled: "bg-destructive text-destructive-foreground"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground">Gérez vos séances et réservations</p>
        </div>
        
        <Button className="bg-gradient-hero shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle séance
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="border-border/50">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
              Décembre 2024
            </h2>
            <Button variant="outline" size="icon" className="border-border/50">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" className="border-border/50">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Aujourd'hui
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
          {(['month', 'week', 'day'] as const).map((viewType) => (
            <Button
              key={viewType}
              variant={view === viewType ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView(viewType)}
              className={view === viewType ? "bg-primary text-primary-foreground" : ""}
            >
              {viewType === 'month' && 'Mois'}
              {viewType === 'week' && 'Semaine'}
              {viewType === 'day' && 'Jour'}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Vue semaine</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b border-border/30">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 6; // Start from previous month
                  const isToday = day === 15; // Mock today
                  const hasSession = [12, 15, 18, 22].includes(day); // Mock sessions
                  
                  return (
                    <div
                      key={i}
                      className={`
                        min-h-[80px] p-2 border border-border/20 rounded-lg transition-all duration-200 hover:bg-muted/30 cursor-pointer
                        ${isToday ? 'bg-primary/10 border-primary/30' : 'bg-background/50'}
                        ${hasSession ? 'border-accent/40' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {day > 0 ? day : ''}
                      </div>
                      
                      {hasSession && (
                        <div className="mt-1 space-y-1">
                          <div className="w-full h-1 bg-accent rounded-full" />
                          <div className="text-xs text-accent font-medium">Séance</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Sessions */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="p-3 bg-background/30 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-foreground">{session.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {session.time}
                      </div>
                    </div>
                    <Badge className={statusColors[session.status as keyof typeof statusColors]}>
                      {session.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {session.studio}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3 h-3" />
                      {session.client}
                    </div>
                  </div>
                  
                  <Badge className={sessionTypes[session.type as keyof typeof sessionTypes].color + " mt-2"}>
                    {sessionTypes[session.type as keyof typeof sessionTypes].label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5">
                <Plus className="w-4 h-4 mr-2 text-accent" />
                Nouvelle séance
              </Button>
              
              <Button variant="outline" className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5">
                <Music className="w-4 h-4 mr-2 text-primary" />
                Bloc d'enregistrement
              </Button>
              
              <Button variant="outline" className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5">
                <CalendarIcon className="w-4 h-4 mr-2 text-success" />
                Disponibilités
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;