import { useQuery } from '@tanstack/react-query';

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
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  });
}
