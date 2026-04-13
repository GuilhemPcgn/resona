import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export async function GET(request: NextRequest) {
  // ── Auth via Bearer token (même pattern que le backend NestJS) ──────────────
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  // Crée un client Supabase avec le JWT de l'utilisateur → RLS actif
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Mois courant / précédent
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Semaine courante [lundi 00:00, lundi+7[
    const startOfWeek = new Date(now)
    const dow = startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(startOfWeek.getDate() - dow)
    const startOfNextWeek = new Date(startOfWeek)
    startOfNextWeek.setDate(startOfWeek.getDate() + 7)

    // Helper pour col DATE
    const d = (date: Date) => date.toISOString().slice(0, 10)

    // 1) Projets actifs
    const { count: activeProjects, error: pErr } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'in_progress', 'on_hold'])
    if (pErr) throw pErr

    // 2) Nouveaux projets ce mois-ci
    const { count: newProjectsThisMonth, error: npmErr } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisMonth.toISOString())
    if (npmErr) throw npmErr

    // 3) Séances planifiées cette semaine
    const { count: sessionsThisWeek, error: sErr } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gte('start_date', startOfWeek.toISOString())
      .lt('start_date', startOfNextWeek.toISOString())
    if (sErr) throw sErr

    // 4) Revenus du mois (factures payées)
    const { data: monthlyInvoices, error: miErr } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')
      .gte('paid_date', d(startOfThisMonth))
      .lt('paid_date', d(startOfNextMonth))
    if (miErr) throw miErr

    const monthlyRevenue =
      monthlyInvoices?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) ?? 0

    // 5) Revenus du mois précédent
    const { data: lastMonthInvoices, error: lmiErr } = await supabase
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

    // 6) Clients actifs = liés à un projet non terminé
    const { data: activeClientsRows, error: acErr } = await supabase
      .from('projects')
      .select('client_id')
      .in('status', ['draft', 'in_progress', 'on_hold'])
    if (acErr) throw acErr
    const activeClients = new Set(
      (activeClientsRows ?? []).map((p) => p.client_id).filter(Boolean),
    ).size

    // 7) Nouveaux clients ce mois-ci
    const { count: newClients, error: ncErr } = await supabase
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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
