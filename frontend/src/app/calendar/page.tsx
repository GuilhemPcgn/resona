"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppLayout from "@/components/layout/AppLayout";
import { SessionForm } from "@/components/sessions/SessionForm";
import { SessionCard } from "@/components/sessions/SessionCard";
import { CalendarLegend } from "@/components/sessions/CalendarLegend";
import { fetchWithAuth } from "@/lib/api-client";
import type {
  SessionFormData,
  SessionForEdit,
} from "@/components/sessions/SessionForm";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  title: string;
  session_type: string;
  location?: string | null;
  project_id: string;
  client_id?: string | null;
  start_date: string;
  end_date: string;
  hourly_rate?: number | null;
  notes?: string | null;
  status?: string;
  clients?: { name: string; company: string | null } | null;
  created_at: string;
}

type ViewMode = "month" | "week" | "day";

// ─── Filter options ───────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: "__all__", label: "Tous les types" },
  { value: "recording",  label: "Prise voix" },
  { value: "mixing",     label: "Mixage" },
  { value: "mastering",  label: "Mastering" },
  { value: "production", label: "Prod/Beatmaking" },
  { value: "editing",    label: "Montage" },
  { value: "meeting",    label: "Réunion" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "__all__",   label: "Tous les statuts" },
  { value: "pending",   label: "En attente" },
  { value: "confirmed", label: "Confirmées" },
  { value: "paid",      label: "Payées" },
  { value: "cancelled", label: "Annulées" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}

function fmtRange(start: string, end: string): string {
  return `${start.slice(11, 16)} → ${end.slice(11, 16)}`;
}

function sessionDayKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const dowFirst = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - dowFirst);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function buildWeekDays(anchor: Date): Date[] {
  const dow = (anchor.getDay() + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function periodTitle(date: Date, view: ViewMode): string {
  const locale = "fr-FR";
  if (view === "month") {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }
  if (view === "week") {
    const days = buildWeekDays(date);
    const first = days[0];
    const last = days[6];
    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} – ${last.getDate()} ${last.toLocaleDateString(locale, { month: "long", year: "numeric" })}`;
    }
    return `${first.toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${last.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const WEEK_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const queryClient = useQueryClient();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(() => new Date(today));
  const [view, setView] = useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = useState<string>(() => dayKey(today));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SessionForEdit | null>(null);
  const [defaultStart, setDefaultStart] = useState<string | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");

  // ── Derived calendar data ──────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthGrid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekDays = useMemo(() => buildWeekDays(currentDate), [currentDate]);

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === "month") {
      return {
        rangeStart: `${dayKey(monthGrid[0])}T00:00:00`,
        rangeEnd: `${dayKey(monthGrid[41])}T23:59:59`,
      };
    }
    if (view === "week") {
      return {
        rangeStart: `${dayKey(weekDays[0])}T00:00:00`,
        rangeEnd: `${dayKey(weekDays[6])}T23:59:59`,
      };
    }
    return {
      rangeStart: `${selectedDay}T00:00:00`,
      rangeEnd: `${selectedDay}T23:59:59`,
    };
  }, [view, month, year, weekDays, selectedDay, monthGrid]); // eslint-disable-line

  const { data, isLoading } = useQuery<{ data: Session[]; total: number }>({
    queryKey: ["sessions", rangeStart, rangeEnd, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: "200",
        start_date: rangeStart,
        end_date: rangeEnd,
      });
      if (filterType !== "__all__") params.set("session_type", filterType);
      if (filterStatus !== "__all__") params.set("status", filterStatus);
      const res = await fetchWithAuth(`/sessions?${params}`);
      return res.json();
    },
  });
  const sessions = useMemo(() => data?.data ?? [], [data]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const k = sessionDayKey(s.start_date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    map.forEach((list) => {
      list.sort((a, b) => a.start_date.localeCompare(b.start_date));
    });
    return map;
  }, [sessions]);

  const selectedDaySessions = sessionsByDay.get(selectedDay) ?? [];

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + dir, 1);
    } else if (view === "week") {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setDate(d.getDate() + dir);
      setSelectedDay(dayKey(d));
    }
    setCurrentDate(d);
  };

  const goToday = () => {
    setCurrentDate(new Date(today));
    setSelectedDay(dayKey(today));
  };

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: async (body: SessionFormData) => {
      const res = await fetchWithAuth("/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Séance créée avec succès");
      setSheetOpen(false);
    },
    onError: () => toast.error("Erreur lors de la création de la séance"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: SessionFormData }) => {
      const res = await fetchWithAuth(`/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Séance modifiée avec succès");
      setSheetOpen(false);
    },
    onError: () => toast.error("Erreur lors de la modification de la séance"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(`/sessions/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Séance supprimée");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la séance");
      setDeleteId(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = (preStart?: string) => {
    setEditTarget(null);
    setDefaultStart(preStart);
    setSheetOpen(true);
  };

  const openEdit = (session: Session) => {
    setEditTarget({
      id: session.id,
      title: session.title,
      session_type: session.session_type as SessionForEdit["session_type"],
      location: session.location as SessionForEdit["location"],
      status: session.status as SessionForEdit["status"],
      project_id: session.project_id,
      client_id: session.client_id ?? undefined,
      start_date: session.start_date,
      end_date: session.end_date,
      hourly_rate: session.hourly_rate ?? undefined,
      notes: session.notes ?? undefined,
    });
    setDefaultStart(undefined);
    setSheetOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(dayKey(date));
    if (view === "day") setCurrentDate(date);
  };

  const handleDayDoubleClick = (date: Date) => {
    openCreate(`${dayKey(date)}T10:00`);
  };

  const handleFormSubmit = (formData: SessionFormData) => {
    const payload: SessionFormData = {
      ...formData,
      client_id: formData.client_id || undefined,
      notes: formData.notes || undefined,
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Calendar views ─────────────────────────────────────────────────────────

  function MonthView() {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-border/20 rounded-lg overflow-hidden">
            {monthGrid.map((date, i) => {
              const key = dayKey(date);
              const isCurrentMonth = date.getMonth() === month;
              const isTodayCell = dayKey(date) === dayKey(today);
              const isSelected = key === selectedDay;
              const daySessions = sessionsByDay.get(key) ?? [];

              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(date)}
                  onDoubleClick={() => handleDayDoubleClick(date)}
                  className={cn(
                    "min-h-[90px] p-1.5 bg-background/50 cursor-pointer transition-colors",
                    !isCurrentMonth && "opacity-40",
                    isTodayCell && "bg-primary/8",
                    isSelected && "bg-primary/12 ring-1 ring-inset ring-primary/40",
                    "hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1",
                      isTodayCell
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {daySessions.slice(0, 2).map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        variant="compact"
                        onClick={openEdit}
                      />
                    ))}
                    {daySessions.length > 2 && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{daySessions.length - 2} autre
                        {daySessions.length > 3 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Double-clic sur un jour pour créer une séance
          </p>
        </CardContent>
      </Card>
    );
  }

  function WeekView() {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date) => {
              const key = dayKey(date);
              const isTodayCell = key === dayKey(today);
              const isSelected = key === selectedDay;
              const daySessions = sessionsByDay.get(key) ?? [];

              return (
                <div
                  key={key}
                  onClick={() => handleDayClick(date)}
                  onDoubleClick={() => handleDayDoubleClick(date)}
                  className={cn(
                    "rounded-lg p-2 cursor-pointer transition-colors border border-transparent",
                    isSelected && "border-primary/40 bg-primary/8",
                    isTodayCell && !isSelected && "bg-primary/5",
                    "hover:bg-muted/30",
                  )}
                >
                  <div className="text-center mb-2">
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mx-auto mt-0.5",
                        isTodayCell
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  <div className="space-y-1 min-h-[60px]">
                    {daySessions.length === 0 && (
                      <div className="border-2 border-dashed border-border/30 rounded h-12" />
                    )}
                    {daySessions.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        variant="compact"
                        onClick={(session) => {
                          openEdit(session as Session);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Double-clic sur un jour pour créer une séance
          </p>
        </CardContent>
      </Card>
    );
  }

  function DayView() {
    const daySessions = sessionsByDay.get(selectedDay) ?? [];

    return (
      <Card className="bg-gradient-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!isLoading && daySessions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <CalendarIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Aucune séance ce jour</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-border/50"
                onClick={() => openCreate(`${selectedDay}T10:00`)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Créer une séance
              </Button>
            </div>
          )}
          {daySessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              variant="normal"
              onEdit={(session) => openEdit(session as Session)}
              onDelete={setDeleteId}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendrier</h1>
            <p className="text-muted-foreground">
              Gérez vos séances et réservations
            </p>
          </div>
          <Button
            className="bg-gradient-hero shadow-glow"
            onClick={() => openCreate()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle séance
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="border-border/50 h-8 w-8"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-semibold text-foreground min-w-[220px] text-center capitalize">
                {periodTitle(currentDate, view)}
              </h2>
              <Button
                variant="outline"
                size="icon"
                className="border-border/50 h-8 w-8"
                onClick={() => navigate(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-border/50"
              onClick={goToday}
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
              Aujourd'hui
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtres */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-[150px] text-xs border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[150px] text-xs border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
              {(["month", "week", "day"] as const).map((v) => (
                <Button
                  key={v}
                  variant={view === v ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView(v)}
                  className={cn(
                    "h-7 px-3 text-sm",
                    view === v && "bg-primary text-primary-foreground",
                  )}
                >
                  {v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Légende */}
        <CalendarLegend />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            {isLoading && view !== "day" ? (
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: 42 }).map((_, i) => (
                      <Skeleton key={i} className="h-[90px]" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : view === "month" ? (
              <MonthView />
            ) : view === "week" ? (
              <WeekView />
            ) : (
              <DayView />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected day sessions */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4" />
                  {selectedDay === dayKey(today)
                    ? "Aujourd'hui"
                    : new Date(selectedDay + "T12:00:00").toLocaleDateString(
                        "fr-FR",
                        { weekday: "long", day: "numeric", month: "short" },
                      )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                )}
                {!isLoading && selectedDaySessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune séance
                  </p>
                )}
                {selectedDaySessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    variant="normal"
                    onEdit={(session) => openEdit(session as Session)}
                    onDelete={setDeleteId}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/50 border-dashed hover:border-primary/40 hover:bg-primary/5 mt-1"
                  onClick={() => openCreate(`${selectedDay}T10:00`)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Séance ce jour
                </Button>
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base">
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => openCreate()}
                >
                  <Plus className="w-4 h-4 mr-2 text-accent" />
                  Nouvelle séance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  onClick={() => setView("week")}
                >
                  <Music className="w-4 h-4 mr-2 text-primary" />
                  Vue semaine
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  onClick={goToday}
                >
                  <CalendarIcon className="w-4 h-4 mr-2 text-success" />
                  Aller à aujourd'hui
                </Button>
                {sessions.length > 0 && (
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>Séances visibles</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {sessions.length}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Session form */}
      <SessionForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        session={editTarget}
        defaultStart={defaultStart}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La séance sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
