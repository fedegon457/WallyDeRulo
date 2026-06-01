import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @deno-types="https://esm.sh/web-push@3/src/index.d.ts"
import webpush from 'https://esm.sh/web-push@3.6.7'

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:fefe1carini@gmail.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const today    = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dayOfMonth = tomorrow.getDate()

  // Fetch recurring expenses due tomorrow
  const { data: upcoming } = await supabase
    .from('recurring_expenses')
    .select('user_id, name, amount')
    .eq('is_active', true)
    .eq('day_of_month', dayOfMonth)

  if (!upcoming?.length) return new Response('no upcoming', { status: 200 })

  // Group by user
  const byUser = upcoming.reduce<Record<string, typeof upcoming>>((acc, r) => {
    acc[r.user_id] = acc[r.user_id] ?? []
    acc[r.user_id].push(r)
    return acc
  }, {})

  const results: string[] = []

  for (const [userId, expenses] of Object.entries(byUser)) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs?.length) continue

    const fmt = (n: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

    const names   = expenses.map(e => e.name).join(', ')
    const total   = expenses.reduce((s, e) => s + e.amount, 0)
    const body    = expenses.length === 1
      ? `${expenses[0].name} · ${fmt(expenses[0].amount)}`
      : `${names} · Total: ${fmt(total)}`

    const payload = JSON.stringify({
      title: 'Gasto fijo mañana',
      body,
      icon:  '/pwa-192x192.png',
      url:   '/gastos-fijos',
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        results.push(`sent:${sub.endpoint.slice(-8)}`)
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          results.push(`removed:${sub.endpoint.slice(-8)}`)
        } else {
          results.push(`error:${err.statusCode}`)
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
