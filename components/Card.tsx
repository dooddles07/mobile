import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DesignSystem } from '../constants/DesignSystem';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({ children, variant = 'default', style }) => {
  const cardStyle = variant === 'elevated' ? DesignSystem.cards.elevated : DesignSystem.cards.default;

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

export default Card;
