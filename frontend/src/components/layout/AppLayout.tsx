"use client";

import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const hasTrack = usePlayerStore((s) => !!selectCurrentTrack(s));

  return (
    <SidebarProvider style={{ "--sidebar-width": "12rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un projet, client..."
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Main Content — extra bottom padding when player is active */}
          <main className={`flex-1 overflow-auto p-6 ${hasTrack ? "pb-20" : ""}`}>
            {children}
          </main>
        </div>
      </div>

    </SidebarProvider>
  );
}