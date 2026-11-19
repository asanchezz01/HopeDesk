import React from 'react'
import { StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

import { useTheme } from '../../theme/ThemeContext'
import { Radius, Shadows } from '../../theme/tokens'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  padding?: boolean
}

/**
 * Superfície padrão de bloco.
 *
 * Já teve uma faixa colorida de 4px na aresta esquerda (`accent`). Saiu: em
 * telas com muitos cartões a régua de cores competia com o conteúdo, e o papel
 * de cada bloco já está no título e no `StatusBadge`.
 */
export default function Card({ children, style, padding = true }: CardProps) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
        padding && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    // `rounded-xl` do padrão: controle 12, cartão 16, contêiner 20–24.
    borderRadius: Radius.xl,
    // A borda é o que separa o cartão do fundo nos dois temas; a sombra é só um
    // reforço no claro, e some visualmente no escuro sem prejuízo. Ela é
    // tingida de azul-noite, nunca de preto puro.
    ...Shadows.card,
  },
  padded: { padding: 20 },
})
