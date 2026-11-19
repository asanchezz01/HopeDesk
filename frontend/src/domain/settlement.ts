// Acerto de contas mensal entre os técnicos — a planilha "Acerto mês" do GPC.
//
//   valor hora       = parâmetro `activity_hourly_rate`
//   valor franquia   = franquia (h) × valor hora          → dividido IGUALMENTE
//   excedente (h)    = horas do mês − franquia (mín. 0)
//   valor excedente  = excedente × valor hora              → dividido pela
//                      PROPORÇÃO de horas de cada técnico no total do mês
//
// Só entra na divisão quem registrou horas no mês.

export interface TechnicianHours {
  name: string
  hours: number
}

export interface SettlementRow {
  name: string
  hours: number
  /** Fração das horas do mês (0..1). */
  share: number
  franchisePart: number
  excessPart: number
  total: number
}

export interface Settlement {
  totalHours: number
  franchiseHours: number
  hourlyRate: number
  franchiseValue: number
  excessHours: number
  excessValue: number
  totalValue: number
  rows: SettlementRow[]
}

const cents = (value: number) => Math.round(value * 100) / 100

export function computeSettlement(input: {
  franchiseHours: number
  hourlyRate: number
  technicians: TechnicianHours[]
}): Settlement {
  const { franchiseHours, hourlyRate } = input
  const people = input.technicians.filter((t) => t.hours > 0).sort((a, b) => b.hours - a.hours)
  const totalHours = people.reduce((sum, t) => sum + t.hours, 0)
  const franchiseValue = cents(franchiseHours * hourlyRate)
  const excessHours = Math.max(0, totalHours - franchiseHours)
  const excessValue = cents(excessHours * hourlyRate)
  const totalValue = people.length ? cents(franchiseValue + excessValue) : 0

  const rows = people.map((t) => {
    const share = t.hours / totalHours
    const franchisePart = cents(franchiseValue / people.length)
    const excessPart = cents(excessValue * share)
    return { name: t.name, hours: t.hours, share, franchisePart, excessPart, total: 0 }
  })

  // Arredondar cada parte deixa a soma um centavo acima ou abaixo do total
  // faturado; a diferença vai para quem tem mais horas (primeira linha).
  const drift = cents(totalValue - rows.reduce((s, r) => s + r.franchisePart + r.excessPart, 0))
  if (rows.length && drift !== 0) rows[0].excessPart = cents(rows[0].excessPart + drift)
  for (const row of rows) row.total = cents(row.franchisePart + row.excessPart)

  return {
    totalHours,
    franchiseHours,
    hourlyRate,
    franchiseValue,
    excessHours,
    excessValue,
    totalValue,
    rows,
  }
}
