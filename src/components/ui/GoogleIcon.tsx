import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const GoogleIcon: React.FC<{ size?: number }> = ({ size = 22 }) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {/* Crisp native Google G representation */}
      <Text style={[styles.letterG, { fontSize: size * 0.85, lineHeight: size }]}>G</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    marginRight: 12,
  },
  letterG: {
    color: '#FFFFFF',
    fontWeight: '900',
    textAlign: 'center',
  },
});
