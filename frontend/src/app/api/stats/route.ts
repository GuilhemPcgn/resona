import { NextResponse } from 'next/server'
import { supabaseServer } from '@/integrations/supabase/server' // <-- réutilise ton client serveur

// Données de démonstration
const mockStats = {
  activeProjects: 8,
  newProjectsThisMonth: 3,
  sessionsThisWeek: 12,
  monthlyRevenue: 15400,
  revenueDelta: 0.15,
  activeClients: 14,
  newClients: 4,
}

export async function GET() {
  // Si Supabase n'est pas configuré, retourner les données de démonstration
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase non configuré, utilisation des données de démonstration')
    return NextResponse.json(mockStats)
  }

  try {
    const now = new Date()

    // Mois courant / précédent
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Semaine courante [lundi 00:00, lundi+7[
    const startOfWeek = new Date(now)
    const dow = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1 // lundi=0
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - dow)
    const startOfNextWeek = new Date(startOfWeek)
    startOfNextWeek.setDate(startOfWeek.getDate() + 7)

    // Helpers pour col DATE
    const d = (date: Date) => date.toISOString().slice(0, 10)

    // 1) Projets actifs = tous sauf completed/delivered
    const { count: activeProjects, error: pErr } = await supabaseServer
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress', 'mixing', 'mastering'])
    if (pErr) throw pErr

    // 2) Nouveaux projets ce mois-ci
    const { count: newProjectsThisMonth, error: npmErr } = await supabaseServer
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisMonth.toISOString())
    if (npmErr) throw npmErr

    // 3) Séances planifiées cette semaine (start_date)
    const { count: sessionsThisWeek, error: sErr } = await supabaseServer
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('start_date', startOfWeek.toISOString())
      .lt('start_date', startOfNextWeek.toISOString())
    if (sErr) throw sErr

    // 4) Revenus du mois (status='paid', paid_date sur col DATE)
    const { data: monthlyInvoices, error: miErr } = await supabaseServer
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('paid_date', d(startOfThisMonth))
      .lt('paid_date', d(startOfNextMonth))
    if (miErr) throw miErr

    const monthlyRevenue =
      monthlyInvoices?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) ?? 0

    // 5) Revenus du mois précédent
    const { data: lastMonthInvoices, error: lmiErr } = await supabaseServer
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('paid_date', d(startOfLastMonth))
      .lt('paid_date', d(startOfThisMonth))
    if (lmiErr) throw lmiErr

    const lastMonthRevenue =
      lastMonthInvoices?.reduce((s, r) => s + Number(r.total_amount || 0), 0) ?? 0

    const revenueDelta =
      lastMonthRevenue > 0 ? (monthlyRevenue - lastMonthRevenue) / lastMonthRevenue : 0

    // 6) Clients actifs = liés à au moins un projet non terminé
    const { data: activeClientsRows, error: acErr } = await supabaseServer
      .from('projects')
      .select('client_id')
      .in('status', ['draft', 'in_progress', 'mixing', 'mastering'])
    if (acErr) throw acErr
    const activeClients = new Set((activeClientsRows ?? []).map(p => p.client_id)).size

    // 7) Nouveaux clients ce mois-ci
    const { count: newClients, error: ncErr } = await supabaseServer
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisMonth.toISOString())
    if (ncErr) throw ncErr

    return NextResponse.json({
      activeProjects: activeProjects ?? 0,
      newProjectsThisMonth: newProjectsThisMonth ?? 0,
      sessionsThisWeek: sessionsThisWeek ?? 0,
      monthlyRevenue,
      revenueDelta,
      activeClients,
      newClients: newClients ?? 0,
    })
  } catch (error) {
    console.error('Erreur stats:', error)
    console.warn('Utilisation des données de démonstration suite à l\'erreur')
    // En cas d'erreur (ex: tables Supabase n'existent pas), retourner les données de démo
    return NextResponse.json(mockStats)
  }
}
