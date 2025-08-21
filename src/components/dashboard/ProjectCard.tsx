import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Music, MoreHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  id: string;
  title: string;
  artist: string;
  status: "recording" | "mixing" | "mastering" | "completed";
  progress: number;
  nextSession?: string;
  tracksCount: number;
  lastActivity: string;
}

const statusConfig = {
  recording: {
    label: "Enregistrement",
    className: "status-recording",
    color: "bg-destructive text-destructive-foreground"
  },
  mixing: {
    label: "Mixage",
    className: "status-mixing",
    color: "bg-warning text-warning-foreground"
  },
  mastering: {
    label: "Mastering",
    className: "status-mastering",
    color: "bg-accent text-accent-foreground"
  },
  completed: {
    label: "Terminé",
    className: "status-completed",
    color: "bg-success text-success-foreground"
  }
};

export function ProjectCard({
  title,
  artist,
  status,
  progress,
  nextSession,
  tracksCount,
  lastActivity
}: ProjectCardProps) {
  const statusInfo = statusConfig[status];

  return (
    <Card className="group bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-medium">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", statusInfo.color)}>
              {statusInfo.label}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Music className="h-4 w-4" />
              <span>{tracksCount} pistes</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{lastActivity}</span>
            </div>
          </div>
        </div>

        {/* Next Session */}
        {nextSession && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-foreground">Prochaine séance: {nextSession}</span>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
              <Play className="h-3 w-3 mr-1" />
              Rejoindre
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}