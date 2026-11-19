import React, { useId, useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import type { KeyboardTypeOptions, TextInputProps } from 'react-native'

import { useTheme } from '../../theme/ThemeContext'
import { Radius, Typography } from '../../theme/tokens'

interface InputProps {
  label?: string
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: TextInputProps['autoCapitalize']
  autoComplete?: TextInputProps['autoComplete']
  textContentType?: TextInputProps['textContentType']
  error?: string
  /** Texto de apoio exibido quando não há erro. */
  hint?: string
  disabled?: boolean
  onSubmitEditing?: () => void
  returnKeyType?: TextInputProps['returnKeyType']
  /** Campo de texto longo (descrição de chamado, notas de atividade). */
  multiline?: boolean
  /** Altura inicial em linhas; só tem efeito com `multiline`. */
  rows?: number
  maxLength?: number
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  textContentType,
  error,
  hint,
  disabled = false,
  onSubmitEditing,
  returnKeyType,
  multiline = false,
  rows = 5,
  maxLength,
}: InputProps) {
  const theme = useTheme()
  const describedBy = useId()
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.container}>
      {label && (
        <Text
          nativeID={`${describedBy}-label`}
          style={[styles.label, { color: theme.textPrimary }]}
        >
          {label}
        </Text>
      )}
      <TextInput
        // Sem isto o leitor de tela anuncia apenas "campo de texto": o <Text>
        // do rótulo não se associa sozinho ao input no React Native.
        accessibilityLabel={label}
        accessibilityLabelledBy={label ? `${describedBy}-label` : undefined}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled }}
        style={[
          styles.input,
          {
            backgroundColor: theme.cardBg,
            borderColor: error ? theme.danger : focused ? theme.primary : theme.border,
            color: theme.textPrimary,
          },
          // O contorno padrão do navegador (branco, retangular) ignorava o raio
          // e o tema; o foco agora é a borda na cor da ação mais um halo tênue.
          focused && webFocusRing(error ? theme.dangerSoft : theme.primarySoft),
          multiline && { minHeight: 24 * rows, textAlignVertical: 'top' },
          disabled && styles.disabled,
        ]}
        multiline={multiline}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {error ? (
        // `alert` faz o leitor de tela anunciar a mensagem assim que ela surge.
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text>
      ) : null}
    </View>
  )
}

/** Halo de foco no web; no nativo a borda colorida basta. */
function webFocusRing(color: string) {
  return Platform.OS === 'web' ? ({ boxShadow: `0 0 0 3px ${color}` } as object) : null
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { ...Typography.label, marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    // `rounded-lg` do padrão vale 12px, não os 8px de fábrica do Tailwind.
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    // O foco é desenhado pela borda e pelo halo (ver `webFocusRing`).
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  disabled: { opacity: 0.6 },
  error: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  hint: { marginTop: 6, fontSize: 12 },
})
