import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../constants/DesignSystem';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d1fae5',
          borderColor: DesignSystem.colors.semantic.success,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: DesignSystem.colors.semantic.success,
        };
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          borderColor: DesignSystem.colors.semantic.error,
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: DesignSystem.colors.semantic.error,
        };
      case 'warning':
        return {
          backgroundColor: '#fef3c7',
          borderColor: DesignSystem.colors.semantic.warning,
          icon: 'warning' as keyof typeof Ionicons.glyphMap,
          iconColor: DesignSystem.colors.semantic.warning,
        };
      case 'info':
      default:
        return {
          backgroundColor: '#d1fae5',
          borderColor: DesignSystem.colors.semantic.info,
          icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
          iconColor: DesignSystem.colors.semantic.info,
        };
    }
  };

  const config = getAlertConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
        },
      ]}
    >
      <Ionicons name={config.icon} size={DesignSystem.iconSize.base} color={config.iconColor} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.spacing.base,
    borderRadius: DesignSystem.borderRadius.base,
    borderLeftWidth: 4,
    marginBottom: DesignSystem.spacing.base,
    gap: DesignSystem.spacing.md,
  },
  message: {
    flex: 1,
    fontSize: DesignSystem.typography.fontSize.sm,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    color: DesignSystem.colors.text.primary,
    lineHeight: DesignSystem.typography.lineHeight.normal * DesignSystem.typography.fontSize.sm,
  },
});

export default Alert;
