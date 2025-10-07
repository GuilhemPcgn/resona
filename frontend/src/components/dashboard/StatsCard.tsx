import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  variant?: "default" | "accent" | "success" | "warning";
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default" 
}: StatsCardProps) {
  const variantStyles = {
    default: "border-border bg-gradient-card",
    accent: "border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 shadow-accent-glow/20",
    success: "border-success/20 bg-gradient-to-br from-success/10 to-success/5",
    warning: "border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card className={cn("relative overflow-hidden transition-all duration-300 hover:shadow-medium", variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconStyles[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}