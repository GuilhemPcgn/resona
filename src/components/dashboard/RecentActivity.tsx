import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Upload, Calendar, CreditCard } from "lucide-react";

const activities = [
  {
    id: 1,
    user: "Sophie Martin",
    action: "a uploadé un nouveau mix",
    target: "Album Indie - Track 03",
    time: "Il y a 2h",
    type: "upload",
    avatar: "SM"
  },
  {
    id: 2,
    user: "Alex Rivera",
    action: "a programmé une séance",
    target: "Mixage final - Vendredi 14h",
    time: "Il y a 4h",
    type: "session",
    avatar: "AR"
  },
  {
    id: 3,
    user: "Emma Dubois",
    action: "a envoyé une facture",
    target: "Projet Rock Alternative",
    time: "Il y a 6h",
    type: "invoice",
    avatar: "ED"
  },
  {
    id: 4,
    user: "Thomas Chen",
    action: "a commenté",
    target: "Master v2 - Feedback requis",
    time: "Hier",
    type: "comment",
    avatar: "TC"
  }
];

const activityIcons = {
  upload: FileAudio,
  session: Calendar,
  invoice: CreditCard,
  comment: Upload
};

const activityColors = {
  upload: "text-accent",
  session: "text-primary",
  invoice: "text-success",
  comment: "text-warning"
};

export function RecentActivity() {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-foreground">Activité récente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type as keyof typeof activityIcons];
          const colorClass = activityColors[activity.type as keyof typeof activityColors];
          
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {activity.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-muted-foreground"> {activity.action}</span>
                  </p>
                </div>
                <p className="text-sm font-medium text-primary">{activity.target}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}