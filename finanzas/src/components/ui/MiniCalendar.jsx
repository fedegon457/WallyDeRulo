// entries: Array<{ day: number, name: string, paid: boolean }>
export function MiniCalendar({ entries = [], year, month }) {
  const now = new Date()
  const y = year ?? now.getFullYear()
  const m = month ?? now.getMonth()
  const todayDate = (y === now.getFullYear() && m === now.getMonth()) ? now.getDate() : null

  const firstDow = new Date(y, m, 1).getDay()
  const leadingBlanks = (firstDow + 6) % 7
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const byDay = {}
  entries.forEach(e => {
    if (e.day >= 1 && e.day <= daysInMonth) {
      if (!byDay[e.day]) byDay[e.day] = []
      byDay[e.day].push(e)
    }
  })

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <span key={d} className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-wide">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} />
          const es = byDay[day] || []
          const isToday = day === todayDate
          const isPast = todayDate !== null && day < todayDate
          const daysAway = todayDate !== null ? day - todayDate : null

          return (
            <div
              key={day}
              className={`flex flex-col items-center py-0.5 rounded-md ${isToday ? 'bg-primary-500' : ''}`}
            >
              <span className={`text-[10px] font-semibold leading-none ${
                isToday ? 'text-white' : isPast ? 'text-gray-300' : 'text-gray-600'
              }`}>{day}</span>
              {es.length > 0 && (
                <div className="flex gap-px mt-0.5">
                  {es.map((e, j) => {
                    let dot
                    if (e.paid)                                                  dot = 'bg-emerald-400'
                    else if (isToday)                                            dot = 'bg-yellow-300'
                    else if (daysAway !== null && daysAway >= 0 && daysAway <= 2) dot = 'bg-red-400'
                    else if (daysAway !== null && daysAway >= 0 && daysAway <= 6) dot = 'bg-amber-400'
                    else                                                          dot = 'bg-blue-300'
                    return <div key={j} className={`w-1 h-1 rounded-full ${dot}`} />
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-gray-100">
        {[['bg-red-400','Urgente'],['bg-amber-400','Esta semana'],['bg-blue-300','Pendiente'],['bg-emerald-400','Pagado']].map(([cls, lbl]) => (
          <div key={lbl} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${cls}`} />
            <span className="text-[9px] text-gray-400">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
