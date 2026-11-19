import { computeSettlement } from './settlement'

describe('computeSettlement', () => {
  it('reproduz a aba "acerto junho" da planilha', () => {
    const s = computeSettlement({
      franchiseHours: 16,
      hourlyRate: 202.625,
      technicians: [
        { name: 'João', hours: 5.95 },
        { name: 'Anderson', hours: 23.55 },
      ],
    })
    expect(s.totalHours).toBeCloseTo(29.5)
    expect(s.franchiseValue).toBe(3242)
    expect(s.excessHours).toBeCloseTo(13.5)
    expect(s.excessValue).toBe(2735.44)
    expect(s.totalValue).toBe(5977.44)
    expect(s.rows.map((r) => r.name)).toEqual(['Anderson', 'João'])
    expect(s.rows[0].franchisePart).toBe(1621)
    expect(s.rows[0].total).toBeCloseTo(3804.72) // planilha: 3804,71 + 1 centavo de arredondamento
    expect(s.rows[1].total).toBeCloseTo(2172.72)
    expect(s.rows[0].total + s.rows[1].total).toBeCloseTo(s.totalValue)
  })

  it('abaixo da franquia não há excedente e a franquia é dividida igualmente', () => {
    const s = computeSettlement({
      franchiseHours: 16,
      hourlyRate: 200,
      technicians: [
        { name: 'A', hours: 4 },
        { name: 'B', hours: 2 },
        { name: 'Sem horas', hours: 0 },
      ],
    })
    expect(s.excessHours).toBe(0)
    expect(s.excessValue).toBe(0)
    expect(s.rows).toHaveLength(2)
    expect(s.rows.map((r) => r.total)).toEqual([1600, 1600])
  })

  it('sem horas no mês não há o que dividir', () => {
    const s = computeSettlement({ franchiseHours: 16, hourlyRate: 200, technicians: [] })
    expect(s.rows).toEqual([])
    expect(s.totalValue).toBe(0)
  })
})
