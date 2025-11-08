import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { DesignSystem } from '../constants/DesignSystem';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={DesignSystem.colors.primary.main} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: DesignSystem.colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: DesignSystem.colors.background.primary,
    padding: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    ...DesignSystem.shadows.lg,
  },
  message: {
    marginTop: DesignSystem.spacing.md,
    fontSize: DesignSystem.typography.fontSize.base,
    fontWeight: DesignSystem.typography.fontWeight.medium,
    color: DesignSystem.colors.text.primary,
  },
});

export default LoadingOverlay;
