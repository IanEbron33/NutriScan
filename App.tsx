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
import { AuthScreen } from './src/screens/AuthScreen';
import { Flame, TrendingUp, LogOut } from './src/components/ui/LucideIcons';

function MainApp() {
  const { user, profile, isLoading, signOut } = useAuth();

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {/* Header with Avatar & Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>
              Hello, {profile?.full_name?.split(' ')[0] || 'Health Enthusiast'}!
            </Text>
            <Text style={styles.greetingSubtitle}>Let's keep the momentum going.</Text>
          </View>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {(profile?.full_name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Streak & Targets Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakIconBox}>
              <Flame size={24} color="#FF5B00" fill="#FF5B00" />
            </View>
            <View>
              <Text style={styles.streakNumber}>{profile?.streak_days || 1} Days</Text>
              <Text style={styles.streakLabel}>Daily Tracking Streak</Text>
            </View>
          </View>
          <View style={styles.statusPill}>
            <TrendingUp size={14} color="#2E7D32" />
            <Text style={styles.statusPillText}> On track</Text>
          </View>
        </View>

        {/* Daily Goal Summary Preview */}
        <View style={styles.macroCard}>
          <Text style={styles.cardHeader}>DAILY NUTRITION TARGETS</Text>
          <View style={styles.targetRow}>
            <View style={styles.targetCol}>
              <Text style={styles.targetValue}>{profile?.daily_calorie_target || 2400}</Text>
              <Text style={styles.targetUnit}>kcal</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetCol}>
              <Text style={[styles.targetValue, { color: '#E54D42' }]}>
                {profile?.daily_protein_target || 120}g
              </Text>
              <Text style={styles.targetUnit}>Protein</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetCol}>
              <Text style={[styles.targetValue, { color: '#F39C12' }]}>
                {profile?.daily_carbs_target || 250}g
              </Text>
              <Text style={styles.targetUnit}>Carbs</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetCol}>
              <Text style={[styles.targetValue, { color: '#8B5A2B' }]}>
                {profile?.daily_fat_target || 70}g
              </Text>
              <Text style={styles.targetUnit}>Fat</Text>
            </View>
          </View>
        </View>

        {/* User Info & Sign Out CTA */}
        <View style={styles.userCard}>
          <Text style={styles.userEmailLabel}>Logged in as:</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut} activeOpacity={0.8}>
            <LogOut size={16} color="#FF5B00" style={{ marginRight: 6 }} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A1810',
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#8C7B73',
    marginTop: 2,
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#FF5B00',
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF5B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
  },
  streakLabel: {
    fontSize: 12,
    color: '#8C7B73',
  },
  statusPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 12,
  },
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  targetCol: {
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
  },
  targetUnit: {
    fontSize: 12,
    color: '#8C7B73',
    marginTop: 2,
  },
  targetDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F0E6DE',
  },
  userCard: {
    backgroundColor: '#FFF0E6',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  userEmailLabel: {
    fontSize: 12,
    color: '#8C7B73',
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 2,
    marginBottom: 12,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF5B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#FF5B00',
    fontWeight: '700',
    fontSize: 14,
  },
});
