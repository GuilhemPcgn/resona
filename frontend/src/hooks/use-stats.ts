import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  activeProjects: number;
  newProjectsThisMonth: number;
  sessionsThisWeek: number;
  monthlyRevenue: number;
  revenueDelta: number;
  activeClients: number;
  newClients: number;
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session introuvable');

      const response = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? `Erreur ${response.status}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
