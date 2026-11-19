import { FontAwesome6 } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import Card from '../../src/components/Card'
import EmptyState from '../../src/components/EmptyState'
import ErrorState from '../../src/components/ErrorState'
import Select from '../../src/components/Select'
import Skeleton from '../../src/components/Skeleton'
import { useAuth } from '../../src/context/AuthProvider'
import { formatCurrency, formatHours, formatPercent } from '../../src/domain/format'
import { MONTHS_PT, monthLabel } from '../../src/domain/months'
import { computeSettlement } from '../../src/domain/settlement'
import { useCompanyParameters } from '../../src/hooks/useAdmin'
import { useActivityReport } from '../../src/hooks/useReports'
import { useAvailableYears } from '../../src/hooks/useTickets'
import AppShell from '../../src/layout/AppShell'
import { useBreakpoint } from '../../src/layout/useBreakpoint'
import { useTheme } from '../../src/theme/ThemeContext'
import { Radius, Typography } from '../../src/theme/tokens'

/** O acerto é feito depois do fechamento: abre no mês anterior. */
function previousMonth(now = new Date()) {
  const month = now.getMonth() // 0..11 → o mês anterior em 1..12
  return month === 0
    ? { year: now.getFullYear() - 1, month: 12 }
    : { year: now.getFullYear(), month }
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function AdminSettlement() {
  const theme = useTheme()
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const { isMobile } = useBreakpoint()

  const [{ year, month }, setPeriod] = useState(previousMonth)
  const lastDay = new Date(year, month, 0).getDate()
  const range = { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(lastDay)}` }

  const years = useAvailableYears()
  const params = useCompanyParameters(isSuperuser)
  const report = useActivityReport(range, isSuperuser)

  const franchiseHours = Number(params.data?.monthlyHoursAllowance ?? 0)
  const hourlyRate = Number(params.data?.activityHourlyRate ?? 0)

  const settlement = useMemo(
    () =>
      report.data
        ? computeSettlement({
            franchiseHours,
            hourlyRate,
            technicians: report.data.totalsByTechnician.map((t) => ({
              name: t.technicianName,
              hours: t.hours,
            })),
          })
        : null,
    [report.data, franchiseHours, hourlyRate]
  )

  if (!isSuperuser) {
    return (
      <AppShell title="Acerto de contas">
        <Card>
          <EmptyState
            title="Sem permissão"
            description="O acerto de contas é restrito a superusuários."
          />
        </Card>
      </AppShell>
    )
  }

  const yearOptions = (years.data ?? [year]).map((value) => ({ value, label: String(value) }))
  const periodName = `${monthLabel(month)} de ${year}`
  const loading = report.isLoading || params.isLoading
  const error = report.error ?? params.error

  const filters = (
    <Card>
      <View style={styles.filters}>
        <View style={styles.filterField}>
          <Select
            label="Ano"
            value={year}
            options={yearOptions}
            onChange={(value) => setPeriod({ year: value, month })}
          />
        </View>
        <View style={styles.filterField}>
          <Select
            label="Mês"
            value={month}
            options={MONTHS_PT}
            onChange={(value) => setPeriod({ year, month: value })}
          />
        </View>
      </View>
    </Card>
  )

  let body: React.ReactNode
  if (loading) {
    body = (
      <View style={styles.stack}>
        <Skeleton height={150} radius={16} />
        <Skeleton height={220} radius={16} />
      </View>
    )
  } else if (error) {
    body = (
      <ErrorState
        error={error}
        onRetry={() => {
          void report.refetch()
          void params.refetch()
        }}
      />
    )
  } else if (hourlyRate <= 0) {
    body = (
      <Card>
        <EmptyState
          title="Valor hora não configurado"
          description="O acerto multiplica as horas pelo valor hora. Informe-o nos parâmetros da empresa."
          actionLabel="Abrir parâmetros"
          onAction={() => router.push('/admin/parameters')}
        />
      </Card>
    )
  } else if (!settlement || settlement.rows.length === 0) {
    body = (
      <Card>
        <EmptyState
          title="Nenhuma hora registrada"
          description={`Não há atividades em ${periodName}. Escolha outro mês.`}
        />
      </Card>
    )
  } else {
    const s = settlement
    const maxTotal = Math.max(...s.rows.map((r) => r.total))
    const rate = formatCurrency(s.hourlyRate)

    body = (
      <View style={styles.stack}>
        {/* A conta inteira em duas linhas, na ordem em que a planilha a faz:
            primeiro as horas, depois o dinheiro. */}
        <Card>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Como chegamos ao total
          </Text>
          <Text style={[styles.cardHint, { color: theme.muted }]}>
            {periodName} · valor hora {rate}
          </Text>

          <View style={[styles.equation, isMobile && styles.equationStacked]}>
            <Term label="Horas trabalhadas" value={formatHours(s.totalHours)} />
            <Operator icon="minus" />
            <Term label="Franquia" value={formatHours(s.franchiseHours)} />
            <Operator icon="equals" />
            <Term
              label="Horas excedentes"
              value={formatHours(s.excessHours)}
              detail={s.excessHours === 0 ? 'Dentro da franquia' : undefined}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={[styles.equation, isMobile && styles.equationStacked]}>
            <Term
              label="Valor da franquia"
              value={formatCurrency(s.franchiseValue)}
              detail={`${formatHours(s.franchiseHours)} × ${rate}`}
              swatch={theme.chartSecondary}
            />
            <Operator icon="plus" />
            <Term
              label="Valor excedente"
              value={formatCurrency(s.excessValue)}
              detail={`${formatHours(s.excessHours)} × ${rate}`}
              swatch={theme.chartMagnitude}
            />
            <Operator icon="equals" />
            <Term label="Total a faturar" value={formatCurrency(s.totalValue)} emphasis />
          </View>
        </Card>

        <Card>
          <View style={styles.splitHeader}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              Divisão entre os técnicos
            </Text>
            <View style={styles.legend}>
              <Legend
                color={theme.chartSecondary}
                text={`Franquia: partes iguais entre ${s.rows.length}`}
              />
              <Legend color={theme.chartMagnitude} text="Excedente: proporcional às horas" />
            </View>
          </View>

          {s.rows.map((row) => (
            <View
              key={row.name}
              accessible
              accessibilityLabel={`${row.name}: ${formatHours(row.hours)}, ${formatPercent(
                row.share,
                1
              )} das horas. Franquia ${formatCurrency(row.franchisePart)}, excedente ${formatCurrency(
                row.excessPart
              )}, total ${formatCurrency(row.total)}.`}
              style={[styles.person, { borderTopColor: theme.border }]}
            >
              <View style={styles.personHead}>
                <View style={styles.personName}>
                  <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={[styles.meta, { color: theme.textSecondary }]}>
                    {formatHours(row.hours)} · {formatPercent(row.share, 1)} das horas
                  </Text>
                </View>
                <View style={styles.personTotal}>
                  <Text style={[styles.metaLabel, { color: theme.muted }]}>A receber</Text>
                  <Text style={[styles.total, { color: theme.textPrimary }]}>
                    {formatCurrency(row.total)}
                  </Text>
                </View>
              </View>

              {/* Barra empilhada: comprimento = total do técnico relativo ao
                  maior; as duas cores mostram de onde vem cada parte. */}
              <View style={[styles.track, { backgroundColor: theme.chartTrack }]}>
                <View style={[styles.bar, { width: `${(row.total / maxTotal) * 100}%` }]}>
                  <View
                    style={{
                      flex: row.franchisePart,
                      backgroundColor: theme.chartSecondary,
                    }}
                  />
                  {row.excessPart > 0 && (
                    <View style={{ flex: row.excessPart, backgroundColor: theme.chartMagnitude }} />
                  )}
                </View>
              </View>

              <View style={styles.parts}>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  Franquia{' '}
                  <Text style={[styles.strong, { color: theme.textPrimary }]}>
                    {formatCurrency(row.franchisePart)}
                  </Text>
                </Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]}>
                  Excedente{' '}
                  <Text style={[styles.strong, { color: theme.textPrimary }]}>
                    {formatCurrency(row.excessPart)}
                  </Text>
                </Text>
              </View>
            </View>
          ))}

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Text style={[styles.metaLabel, { color: theme.muted }]}>
              Total · {formatHours(s.totalHours)}
            </Text>
            <Text style={[styles.total, { color: theme.textPrimary }]}>
              {formatCurrency(s.totalValue)}
            </Text>
          </View>
        </Card>
      </View>
    )
  }

  return (
    <AppShell title="Acerto de contas" subtitle="Divisão do faturamento do mês entre os técnicos">
      <View style={styles.stack}>
        {filters}
        {body}
      </View>
    </AppShell>
  )
}

function Term({
  label,
  value,
  detail,
  emphasis = false,
  swatch,
}: {
  label: string
  value: string
  detail?: string
  emphasis?: boolean
  swatch?: string
}) {
  const theme = useTheme()
  const { isMobile } = useBreakpoint()
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${detail ? ` (${detail})` : ''}`}
      style={[
        styles.term,
        // Empilhada em coluna, a base de 150 viraria ALTURA (ver `StatTile`).
        isMobile && styles.termStacked,
        emphasis && { backgroundColor: theme.primarySoft, borderRadius: Radius.lg },
      ]}
    >
      <View style={styles.termLabelRow}>
        {swatch && <View style={[styles.swatch, { backgroundColor: swatch }]} />}
        <Text style={[styles.metaLabel, { color: emphasis ? theme.onPrimarySoft : theme.muted }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          emphasis ? styles.termValueEmphasis : styles.termValue,
          { color: emphasis ? theme.onPrimarySoft : theme.textPrimary },
        ]}
      >
        {value}
      </Text>
      {detail && <Text style={[styles.meta, { color: theme.textSecondary }]}>{detail}</Text>}
    </View>
  )
}

function Operator({ icon }: { icon: 'minus' | 'plus' | 'equals' }) {
  const theme = useTheme()
  const { isMobile } = useBreakpoint()
  return (
    <View
      style={[styles.operator, isMobile && styles.operatorStacked]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <FontAwesome6 name={icon} size={14} color={theme.muted} />
    </View>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  const theme = useTheme()
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.meta, { color: theme.textSecondary }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, marginBottom: -16 },
  filterField: { flexGrow: 1, flexBasis: 160, maxWidth: 240, minWidth: 0 },
  cardTitle: Typography.heading3,
  cardHint: { ...Typography.caption, marginTop: 2 },
  equation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  equationStacked: { flexDirection: 'column', alignItems: 'stretch' },
  divider: { height: 1, marginTop: 16 },
  term: { flexGrow: 1, flexBasis: 150, gap: 2, paddingVertical: 10, paddingHorizontal: 12 },
  termLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  termStacked: { flexBasis: 'auto', flexGrow: 0 },
  termValue: { fontSize: 22, fontWeight: '700', lineHeight: 28, fontVariant: ['tabular-nums'] },
  termValueEmphasis: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  operator: { width: 24, alignItems: 'center', alignSelf: 'center' },
  operatorStacked: { alignSelf: 'flex-start', marginLeft: 6 },
  splitHeader: { gap: 8, marginBottom: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  person: { gap: 8, paddingVertical: 14, borderTopWidth: 1, marginTop: 8 },
  personHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  personName: { flex: 1, minWidth: 0, gap: 2 },
  personTotal: { alignItems: 'flex-end' },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { ...Typography.caption, fontSize: 13, lineHeight: 18 },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  strong: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  total: { fontSize: 20, fontWeight: '700', lineHeight: 26, fontVariant: ['tabular-nums'] },
  track: { height: 10, borderRadius: Radius.full, overflow: 'hidden' },
  bar: { flexDirection: 'row', height: '100%', borderRadius: Radius.full, overflow: 'hidden' },
  parts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 14,
  },
})
