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

// Données de démonstration en cas d'erreur (Supabase non configuré)
const mockStats: Stats = {
  activeProjects: 8,
  newProjectsThisMonth: 3,
  sessionsThisWeek: 12,
  monthlyRevenue: 15400,
  revenueDelta: 0.15,
  activeClients: 14,
  newClients: 4,
};

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          console.warn('API stats non disponible, utilisation des données de démonstration');
          return mockStats;
        }
        return response.json();
      } catch (error) {
        console.warn('Erreur lors de la récupération des stats, utilisation des données de démonstration:', error);
        return mockStats;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 minutes
  });
}
