"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState } from "react";
import { GlobalPlayer } from "@/components/audio/GlobalPlayer";

export function Providers({ children }: { children: React.ReactNode }) {
  // Créer le QueryClient une seule fois avec useState pour éviter de le recréer à chaque render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
        <Sonner />
        {/* Lecteur audio persistant — monté une seule fois, survit aux navigations */}
        <GlobalPlayer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

