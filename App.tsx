import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NutritionProvider } from './src/context/NutritionContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

function MainApp() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5B00" />
        <Text style={styles.loadingText}>Loading NutriScan...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Mandatory gate: First-time users must complete the 3-step onboarding flow
  if (!profile?.is_onboarded) {
    return <OnboardingScreen />;
  }

  // Main Dashboard Screen (Matching user screenshot)
  return <DashboardScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NutritionProvider>
          <MainApp />
        </NutritionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#8C7B73',
  },
});
