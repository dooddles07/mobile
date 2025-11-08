import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '../constants/DesignSystem';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'right',
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      ...DesignSystem.buttons[variant],
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...(fullWidth && { width: '100%' }),
    };

    // Size adjustments
    if (size === 'small') {
      return {
        ...baseStyle,
        paddingVertical: 10,
        paddingHorizontal: 16,
      };
    } else if (size === 'large') {
      return {
        ...baseStyle,
        paddingVertical: 18,
        paddingHorizontal: 32,
      };
    }

    return baseStyle;
  };

  const getTextColor = () => {
    if (disabled) return DesignSystem.colors.text.disabled;

    switch (variant) {
      case 'primary':
      case 'danger':
        return DesignSystem.colors.text.inverse;
      case 'secondary':
      case 'ghost':
        return DesignSystem.colors.primary.main;
      default:
        return DesignSystem.colors.text.primary;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return DesignSystem.iconSize.sm;
      case 'large':
        return DesignSystem.iconSize.md;
      default:
        return DesignSystem.iconSize.base;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={getTextColor()}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: DesignSystem.buttons[variant].fontSize,
                fontWeight: DesignSystem.buttons[variant].fontWeight as any,
              },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={getTextColor()}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    textAlign: 'center',
  },
});

export default Button;
