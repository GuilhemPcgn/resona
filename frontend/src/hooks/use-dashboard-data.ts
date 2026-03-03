import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api-client';

export interface Project {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  status: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect' | 'vip';
  created_at: string;
}

export interface Invoice {
  id: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  total_amount: number;
  due_date?: string;
  created_at: string;
}

export function useRecentProjects() {
  return useQuery<{ data: Project[]; total: number }>({
    queryKey: ['dashboard', 'projects'],
    queryFn: async () => {
      const res = await fetchWithAuth('/projects?limit=5');
      return res.json();
    },
  });
}

export function useRecentClients() {
  return useQuery<{ data: Client[]; total: number }>({
    queryKey: ['dashboard', 'clients'],
    queryFn: async () => {
      const res = await fetchWithAuth('/clients?limit=5');
      return res.json();
    },
  });
}

export function usePendingInvoices() {
  return useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['dashboard', 'invoices', 'pending'],
    queryFn: async () => {
      const res = await fetchWithAuth('/invoices?status=pending&limit=5');
      return res.json();
    },
  });
}
