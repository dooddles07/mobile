import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../constants/DesignSystem';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getInputStyle = () => {
    if (error) {
      return [styles.input, DesignSystem.inputs.error];
    }
    if (isFocused) {
      return [styles.input, DesignSystem.inputs.focused];
    }
    return [styles.input, DesignSystem.inputs.default];
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.inputWrapper, !editable && styles.disabled]}>
        {icon && (
          <Ionicons
            name={icon}
            size={DesignSystem.iconSize.sm}
            color={error ? DesignSystem.colors.semantic.error : DesignSystem.colors.primary.main}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[getInputStyle(), { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DesignSystem.colors.text.tertiary}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={DesignSystem.iconSize.sm}
              color={DesignSystem.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle"
            size={DesignSystem.iconSize.xs}
            color={DesignSystem.colors.semantic.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignSystem.spacing.base,
  },
  label: {
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    ...DesignSystem.inputs.default,
  },
  icon: {
    position: 'absolute',
    left: DesignSystem.spacing.base,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: DesignSystem.spacing.base,
    padding: DesignSystem.spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.xs,
  },
  errorText: {
    fontSize: DesignSystem.typography.fontSize.xs,
    color: DesignSystem.colors.semantic.error,
    marginLeft: DesignSystem.spacing.xs,
  },
});

export default Input;
