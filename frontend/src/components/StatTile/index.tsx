import { FontAwesome6 } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { useTheme } from '../../theme/ThemeContext'
import { Radius, Shadows } from '../../theme/tokens'

interface StatTileProps {
  label: string
  value: string
  /** Linha de apoio: comparação, recorte ou unidade. */
  hint?: string
  /**
   * Cor da barra de acento na borda. É orientação de leitura — agrupa os
   * indicadores por assunto —, nunca a única portadora de informação.
   */
  accent?: string
  /** Número-herói: um por tela, para o indicador que a tela lidera. */
  hero?: boolean
  /** Indicadores fora do recorte de período; recebem fundo recessivo. */
  muted?: boolean
  /**
   * Escape para o contêiner em COLUNA.
   *
   * O `flexBasis: 150` abaixo pressupõe uma LINHA, que é como o painel e os
   * relatórios usam o componente. Empilhado numa coluna, esse mesmo valor vira
   * ALTURA e o quadro fica esticado com metade dele vazia. Quem empilha passa
   * `{ flexBasis: 'auto' }` por aqui.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Sem superfície própria (fundo, borda, sombra): o quadro mora dentro de uma
   * faixa de totais que já é a superfície. Assim os totais não se confundem com
   * cartões clicáveis da mesma tela.
   */
  flat?: boolean
  /**
   * Glyph do FontAwesome6 num quadrado tingido pela cor de `accent`, à esquerda
   * do número. Substitui o ponto: marca o quadro como INDICADOR de relance,
   * distinto dos cartões de conteúdo ao redor. Decorativo para leitores de tela.
   */
  icon?: React.ComponentProps<typeof FontAwesome6>['name']
}

/**
 * Número em destaque.
 *
 * Quando a história é um número só, ele É o gráfico — um gráfico de barra única
 * ou uma pizza de duas fatias diriam menos ocupando mais espaço.
 */
export default function StatTile({
  label,
  value,
  hint,
  accent,
  hero = false,
  muted = false,
  style,
  flat = false,
  icon,
}: StatTileProps) {
  const theme = useTheme()
  const tint = accent ?? theme.muted

  const body = (
    <>
      {/* O grupo se marca por um ponto ao lado do rótulo (ou pelo ícone, quando
          houver): identifica o assunto sem colorir texto nem competir com o
          número. A antiga faixa grossa na aresta pesava mais que o indicador. */}
      <View style={styles.labelRow}>
        {accent && !icon && <View style={[styles.dot, { backgroundColor: accent }]} />}
        <Text numberOfLines={2} style={[styles.label, { color: theme.muted }]}>
          {label}
        </Text>
      </View>
      {/* O número usa cor de TEXTO, não a cor da série: identidade fica com a
          marca colorida ao lado, nunca com o texto. Figuras proporcionais, não
          tabulares — num número grande e isolado o dígito de largura fixa
          deixa "121" frouxo. */}
      <Text style={[hero ? styles.valueHero : styles.value, { color: theme.textPrimary }]}>
        {value}
      </Text>
      {hint && (
        <Text numberOfLines={2} style={[styles.hint, { color: theme.textSecondary }]}>
          {hint}
        </Text>
      )}
    </>
  )

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}${hint ? `. ${hint}` : ''}`}
      style={[
        styles.tile,
        {
          backgroundColor: muted ? theme.surfaceMuted : theme.cardBg,
          borderColor: theme.border,
        },
        !muted && !flat && Shadows.card,
        flat && styles.tileFlat,
        hero && styles.tileHero,
        style,
      ]}
    >
      {icon ? (
        <View style={styles.withIcon}>
          {/* `1f` = ~12% de alfa sobre a própria cor; toda cor do tema é #rrggbb. */}
          <View style={[styles.iconBadge, { backgroundColor: `${tint}1f` }]}>
            <FontAwesome6 name={icon} size={16} color={tint} />
          </View>
          <View style={styles.withIconBody}>{body}</View>
        </View>
      ) : (
        body
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 150,
    gap: 3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  tileFlat: { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 },
  tileHero: { flexBasis: 230 },
  withIcon: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  withIconBody: { flex: 1, minWidth: 0, gap: 3 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Alinhado à primeira linha do rótulo, mesmo quando ele quebra em duas.
  dot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'flex-start', marginTop: 3 },
  label: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  valueHero: { fontSize: 40, fontWeight: '700', lineHeight: 46, letterSpacing: -0.5 },
  hint: { fontSize: 12, lineHeight: 16 },
})
