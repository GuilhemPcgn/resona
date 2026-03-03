"use client";

import { MapPin, Laptop, Globe, Clock, User, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Config maps ──────────────────────────────────────────────────────────────

export const TYPE_CONFIG = {
  recording:  { bg: "bg-sky-500/15",   text: "text-sky-400",              label: "Prise voix"      },
  mixing:     { bg: "bg-accent/15",    text: "text-accent",               label: "Mixage"          },
  mastering:  { bg: "bg-success/15",   text: "text-success",              label: "Mastering"       },
  production: { bg: "bg-warning/15",   text: "text-warning",              label: "Prod/Beatmaking" },
  editing:    { bg: "bg-secondary/50", text: "text-secondary-foreground", label: "Montage"         },
  meeting:    { bg: "bg-muted/60",     text: "text-muted-foreground",     label: "Réunion"         },
} as const;

export const STATUS_CONFIG = {
  pending:   { border: "border-l-muted-foreground", dot: "bg-muted-foreground", label: "En attente" },
  confirmed: { border: "border-l-primary",          dot: "bg-primary",          label: "Confirmée"  },
  paid:      { border: "border-l-success",          dot: "bg-success",          label: "Payée"      },
  cancelled: { border: "border-l-destructive",      dot: "bg-destructive",      label: "Annulée"    },
} as const;

type SessionType = keyof typeof TYPE_CONFIG;
type SessionStatus = keyof typeof STATUS_CONFIG;
type SessionLocation = "studio" | "remote" | "on_site";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardSession {
  id: string;
  title: string;
  session_type: string;
  location?: string | null;
  start_date: string;
  end_date: string;
  status?: string;
  clients?: { name: string; company: string | null } | null;
  hourly_rate?: number | null;
  notes?: string | null;
}

interface SessionCardProps {
  session: CardSession;
  variant: "compact" | "normal";
  onClick?: (session: CardSession) => void;
  onEdit?: (session: CardSession) => void;
  onDelete?: (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}

function fmtRange(start: string, end: string): string {
  return `${fmtTime(start)} → ${fmtTime(end)}`;
}

function LocationIcon({ location }: { location?: string | null }) {
  if (location === "remote") return <Laptop className="w-3 h-3 shrink-0" />;
  if (location === "on_site") return <Globe className="w-3 h-3 shrink-0" />;
  return <MapPin className="w-3 h-3 shrink-0" />;
}

function getTypeConfig(sessionType: string) {
  return TYPE_CONFIG[sessionType as SessionType] ?? TYPE_CONFIG.recording;
}

function getStatusConfig(status?: string) {
  return STATUS_CONFIG[(status ?? "pending") as SessionStatus] ?? STATUS_CONFIG.pending;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionCard({ session, variant, onClick, onEdit, onDelete }: SessionCardProps) {
  const typeConfig = getTypeConfig(session.session_type);
  const statusConfig = getStatusConfig(session.status);
  const clientName = session.clients?.name;

  if (variant === "compact") {
    const label = `${session.title} — ${fmtRange(session.start_date, session.end_date)}${clientName ? ` — ${clientName}` : ""}`;
    return (
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(session);
        }}
        className={cn(
          "w-full text-left text-[11px] leading-tight rounded px-1 py-0.5 truncate transition-colors",
          "border-l-[3px]",
          typeConfig.bg,
          typeConfig.text,
          statusConfig.border,
          "hover:brightness-95",
        )}
      >
        <span className="font-semibold">{fmtTime(session.start_date)}</span>
        {session.location && (
          <LocationIcon location={session.location} />
        )}
        {" "}
        <span className="truncate">{session.title}</span>
        {clientName && (
          <span className="opacity-70"> · {clientName.split(" ")[0]}</span>
        )}
      </button>
    );
  }

  // variant === "normal"
  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-colors space-y-2",
        "border-l-[3px]",
        typeConfig.bg,
        statusConfig.border,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {session.location && (
            <span className={cn("shrink-0", typeConfig.text)}>
              <LocationIcon location={session.location} />
            </span>
          )}
          <p className={cn("font-medium text-sm leading-snug truncate", typeConfig.text)}>
            {session.title}
          </p>
        </div>

        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                <MoreHorizontal className="w-3 h-3" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(session)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {onEdit && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => onDelete(session.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {clientName && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 shrink-0" />
            {clientName}
            {session.clients?.company ? ` — ${session.clients.company}` : ""}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0" />
          {fmtRange(session.start_date, session.end_date)}
        </div>
        {session.notes && (
          <p className="line-clamp-2 pt-0.5">{session.notes}</p>
        )}
      </div>
    </div>
  );
}
