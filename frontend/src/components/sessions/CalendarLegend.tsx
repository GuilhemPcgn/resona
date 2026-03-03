"use client";

import { MapPin, Laptop, Globe } from "lucide-react";
import { TYPE_CONFIG, STATUS_CONFIG } from "./SessionCard";
import { cn } from "@/lib/utils";

const LOCATION_CONFIG = [
  { icon: MapPin, label: "Studio" },
  { icon: Laptop, label: "À distance" },
  { icon: Globe,  label: "Sur place" },
];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground px-1">
      {/* Types */}
      <div className="flex items-center gap-2 flex-wrap">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
              cfg.bg,
              cfg.text,
            )}
          >
            {cfg.label}
          </span>
        ))}
      </div>

      <span className="text-border/60 hidden sm:inline">|</span>

      {/* Localisations */}
      <div className="flex items-center gap-3 flex-wrap">
        {LOCATION_CONFIG.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon className="w-3 h-3 shrink-0" />
            {label}
          </span>
        ))}
      </div>

      <span className="text-border/60 hidden sm:inline">|</span>

      {/* Statuts */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
