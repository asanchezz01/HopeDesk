import { FontAwesome6 } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import type { ViewStyle } from 'react-native'

import { useIsDark, useTheme } from '../../theme/ThemeContext'
import { Radius, Shadows, Typography } from '../../theme/tokens'

/**
 * `danger` é a confirmação de uma ação destrutiva (no diálogo). `dangerSoft` é
 * o GATILHO dela numa lista ou ficha: vermelho de texto sobre fundo tênue, para
 * que um "Excluir" por linha não grite mais alto que a ação principal da tela.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerSoft'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  /** Ocupa toda a largura disponível. */
  full?: boolean
  /**
   * Glyph do FontAwesome6 à esquerda do texto. Decorativo: o rótulo continua
   * sendo o que o leitor de tela anuncia, e nenhum botão fica só com ícone.
   */
  icon?: React.ComponentProps<typeof FontAwesome6>['name']
  /** Lado do ícone. À direita para avançar ("Próxima ›"), que é o sentido lido. */
  iconPosition?: 'left' | 'right'
  /** Sobrescreve o texto lido por leitores de tela. */
  accessibilityLabel?: string
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  full = false,
  icon,
  iconPosition = 'left',
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme()
  const isDark = useIsDark()
  const inactive = disabled || loading

  // `onAccentText` acompanha o tema: no claro os preenchimentos são escuros e o
  // texto é branco; no escuro eles são claros e o texto precisa ser escuro.
  const { background, borderColor, textColor } = {
    primary: {
      background: theme.primary,
      borderColor: theme.primary,
      textColor: theme.onAccentText,
    },
    danger: {
      background: theme.danger,
      borderColor: theme.danger,
      textColor: theme.onAccentText,
    },
    secondary: {
      background: theme.cardBg,
      borderColor: theme.border,
      textColor: theme.textPrimary,
    },
    outline: {
      background: 'transparent',
      borderColor: theme.primary,
      textColor: theme.primary,
    },
    dangerSoft: {
      background: theme.dangerSoft,
      borderColor: theme.dangerSoft,
      textColor: theme.danger,
    },
  }[variant]

  // Hover (só no react-native-web): os preenchidos escurecem um pouco; os de
  // contorno ganham o fundo tênue do mesmo papel.
  const hoverStyle: ViewStyle =
    variant === 'secondary'
      ? { backgroundColor: theme.surfaceMuted }
      : variant === 'outline'
        ? { backgroundColor: theme.primarySoft }
        : variant === 'dangerSoft'
          ? { borderColor: theme.danger }
          : { opacity: 0.9 }

  // A sombra verde sob a acao primaria e do padrao da retaguarda, e so no tema
  // claro: sobre a noite ela some visualmente e ainda suja a borda do botao.
  const shape: ViewStyle = {
    backgroundColor: background,
    borderColor,
    ...(variant === 'primary' && !isDark && !inactive ? Shadows.acao : null),
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={(state) => [
        styles.button,
        shape,
        full && styles.full,
        (state as { hovered?: boolean }).hovered && !inactive && hoverStyle,
        state.pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator accessibilityLabel="Processando" color={textColor} />
      ) : (
        <View style={[styles.content, iconPosition === 'right' && styles.contentReversed]}>
          {icon && <FontAwesome6 name={icon} size={14} color={textColor} />}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    // 48 é o alvo de toque mínimo recomendado; abaixo disso o botão fica difícil
    // de acertar no celular.
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contentReversed: { flexDirection: 'row-reverse' },
  full: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
  text: { ...Typography.label, fontWeight: '600' },
})
