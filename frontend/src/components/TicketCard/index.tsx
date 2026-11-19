import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import type { Ticket } from '../../api/tickets'
import { formatHours } from '../../domain/format'
import { formatInstantLabel } from '../../domain/wall-clock'
import { useTheme } from '../../theme/ThemeContext'
import StatusBadge from '../StatusBadge'

interface TicketCardProps {
  ticket: Ticket
  onPress: () => void
  /** Cliente não precisa ver o próprio nome repetido em toda linha da lista. */
  showClient?: boolean
  /** Usado pela grade da listagem para igualar a altura dos cartões da linha. */
  style?: StyleProp<ViewStyle>
}

export default function TicketCard({ ticket, onPress, showClient = true, style }: TicketCardProps) {
  const theme = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Chamado ${ticket.id}: ${ticket.title}. ${ticket.statusLabel}.`}
      accessibilityHint="Abre o detalhe do chamado"
      onPress={onPress}
      // O status fica no badge (cor + rótulo). A faixa grossa na aresta, que
      // repetia a mesma cor, transformava a grade numa régua de listras.
      style={(state) => [
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        // `hovered` só existe no react-native-web.
        (state as { hovered?: boolean }).hovered && { borderColor: theme.muted },
        state.pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.id, { color: theme.muted }]}>#{ticket.id}</Text>
        <StatusBadge status={ticket.status} label={ticket.statusLabel} />
      </View>

      <Text numberOfLines={2} style={[styles.title, { color: theme.textPrimary }]}>
        {ticket.title}
      </Text>

      {/* Mesmo separador " · " do painel e dos relatórios: só o espaço entre
          cliente e módulo fazia os dois nomes parecerem um só. */}
      <Text style={[styles.metaItem, { color: theme.textSecondary }]} numberOfLines={1}>
        {[
          showClient ? ticket.client.name : null,
          ticket.systemModule
            ? // Módulo desativado continua ligado a chamados antigos, que seguem
              // editáveis — sinalizar evita a impressão de dado inconsistente.
              `${ticket.systemModule.name}${ticket.systemModule.isActive ? '' : ' (inativo)'}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.footerItem, { color: theme.muted }]}>
          {/* createdAt é instante UTC: converter para o fuso do aparelho é o
              comportamento correto aqui, ao contrário das atividades. */}
          {formatInstantLabel(ticket.createdAt)}
        </Text>
        <Text style={[styles.footerItem, { color: theme.muted }]}>
          {ticket.technician ? ticket.technician.name : 'Sem técnico'}
          {ticket.activityCount > 0 &&
            ` · ${ticket.activityCount} ${ticket.activityCount === 1 ? 'atividade' : 'atividades'}`}
        </Text>
        <Text style={[styles.footerItem, { color: theme.muted }]}>
          Horas {formatHours(ticket.totalHours)}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 14, borderWidth: 1, borderRadius: 12 },
  pressed: { opacity: 0.85 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  id: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  metaItem: { fontSize: 13 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    // Na grade os cartões da linha têm a mesma altura, mas títulos de tamanhos
    // diferentes: sem isto o rodapé de um flutuaria acima do rodapé do vizinho.
    // Em coluna única não há sobra e o valor não muda nada.
    marginTop: 'auto',
  },
  footerItem: { fontSize: 12 },
})
