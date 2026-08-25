import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useNutrition } from '../context/NutritionContext';
import { ScannerScreen } from './ScannerScreen';
import {
  UtensilsCrossed,
  Flame,
  TrendingUp,
  PieChart,
  Activity,
  CheckCircle2,
  Droplet,
  AlertTriangle,
  Home,
  Calendar,
  Camera,
  UserIcon,
  LogOut,
} from '../components/ui/LucideIcons';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DashboardScreen: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { todayCalories, todayProtein, todayCarbs, todayFat, todayMicros } = useNutrition();

  const [activeTab, setActiveTab] = useState<'home' | 'diary' | 'scan' | 'insights' | 'profile'>('home');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;
  const macroFillAnim = useRef(new Animated.Value(0)).current;
  const circleProgressAnim = useRef(new Animated.Value(0)).current;

  // Targets from profile or smart defaults
  const calorieTarget = profile?.daily_calorie_target || 2400;
  const proteinTarget = profile?.daily_protein_target || 120;
  const carbsTarget = profile?.daily_carbs_target || 250;
  const fatTarget = profile?.daily_fat_target || 70;
  const streakDays = profile?.streak_days || 12;

  // Live dynamic consumed metrics from NutritionContext
  const caloriesConsumed = todayCalories;
  const proteinConsumed = todayProtein;
  const carbsConsumed = todayCarbs;
  const fatConsumed = todayFat;

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Alex';

  useEffect(() => {
    // Staggered smooth entrance and updates animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(macroFillAnim, {
        toValue: 1,
        duration: 850,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(circleProgressAnim, {
        toValue: Math.min(1, caloriesConsumed / calorieTarget),
        duration: 950,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [caloriesConsumed, calorieTarget, proteinConsumed, carbsConsumed, fatConsumed]);

  // SVG Circle Gauge Math
  const radius = 86;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~540.35

  const strokeDashoffset = circleProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  if (isScannerOpen) {
    return <ScannerScreen onClose={() => setIsScannerOpen(false)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Ambient background glow accents matching DESIGN.md */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* 1. Top App Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandLogoBox}>
                <UtensilsCrossed size={18} color="#FF5B00" />
              </View>
              <Text style={styles.brandText}>Dashboard</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowSignOutModal((prev) => !prev)}
              activeOpacity={0.8}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Sign Out Popover */}
          {showSignOutModal && (
            <View style={styles.signOutPopover}>
              <Text style={styles.popoverEmail}>{user?.email}</Text>
              <TouchableOpacity
                style={styles.popoverSignOutButton}
                onPress={signOut}
                activeOpacity={0.8}
              >
                <LogOut size={14} color="#FF5B00" style={{ marginRight: 6 }} />
                <Text style={styles.popoverSignOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Personalized Greeting & Streak */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextCol}>
              <Text style={styles.greetingTitle}>Hello, {firstName}!</Text>
              <Text style={styles.greetingSubtitle}>Let's keep the momentum going.</Text>
            </View>

            <View style={styles.streakPill}>
              <Flame size={16} color="#FF5B00" fill="#FF5B00" />
              <Text style={styles.streakText}>{streakDays} Days</Text>
            </View>
          </View>

          {/* 3. Hero Circular Calorie Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeSvgWrapper}>
              <Svg width={220} height={220} viewBox="0 0 220 220">
                <G rotation="-90" origin="110, 110">
                  {/* Solid unbroken background circle track */}
                  <Circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#F5ECE5"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
                  {/* Continuous smooth active calorie progress arc */}
                  <AnimatedCircle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke="#8B4513"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                  />
                </G>
              </Svg>

              {/* Center Content */}
              <View style={styles.gaugeCenterContent}>
                <Text style={styles.gaugeCalories}>
                  {caloriesConsumed.toLocaleString()}
                </Text>
                <Text style={styles.gaugeTarget}>
                  / {calorieTarget.toLocaleString()} kcal
                </Text>
                <View style={styles.statusPill}>
                  <TrendingUp size={12} color="#2E7D32" strokeWidth={2.5} />
                  <Text style={styles.statusPillText}> On track</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. Daily Macros Card */}
          <View style={styles.macroCard}>
            <View style={styles.macroCardHeader}>
              <PieChart size={18} color="#2A1810" />
              <Text style={styles.macroCardTitle}>Daily Macros</Text>
            </View>

            {/* Protein Row */}
            <View style={styles.macroRow}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: '#E54D42' }]} />
                <Text style={styles.macroName}>Protein</Text>
              </View>
              <Text style={styles.macroNumbers}>
                <Text style={styles.macroBold}>{proteinConsumed}g</Text> / {proteinTarget}g
              </Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#E54D42',
                    width: macroFillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(100, Math.round((proteinConsumed / proteinTarget) * 100))}%`],
                    }),
                  },
                ]}
              />
            </View>

            {/* Carbs Row */}
            <View style={[styles.macroRow, { marginTop: 14 }]}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                <Text style={styles.macroName}>Carbs</Text>
              </View>
              <Text style={styles.macroNumbers}>
                <Text style={styles.macroBold}>{carbsConsumed}g</Text> / {carbsTarget}g
              </Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#F39C12',
                    width: macroFillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(100, Math.round((carbsConsumed / carbsTarget) * 100))}%`],
                    }),
                  },
                ]}
              />
            </View>

            {/* Fats Row */}
            <View style={[styles.macroRow, { marginTop: 14 }]}>
              <View style={styles.macroLabelRow}>
                <View style={[styles.macroDot, { backgroundColor: '#8B5A2B' }]} />
                <Text style={styles.macroName}>Fats</Text>
              </View>
              <Text style={styles.macroNumbers}>
                <Text style={styles.macroBold}>{fatConsumed}g</Text> / {fatTarget}g
              </Text>
            </View>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#8B5A2B',
                    width: macroFillAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${Math.min(100, Math.round((fatConsumed / fatTarget) * 100))}%`],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* 5. Micronutrients Snapshot */}
          <View style={styles.microSection}>
            <View style={styles.microHeaderRow}>
              <View style={styles.microTitleGroup}>
                <Activity size={18} color="#2A1810" />
                <Text style={styles.microSectionTitle}>Micronutrients</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.microCardsScroll}
            >
              {/* Card 1: Vitamin C */}
              <View style={styles.microCard}>
                <View style={styles.microCardTopRow}>
                  <View style={[styles.microIconBox, { backgroundColor: '#E8F5E9' }]}>
                    <UtensilsCrossed size={16} color="#2E7D32" />
                  </View>
                  <CheckCircle2 size={16} color="#2E7D32" />
                </View>
                <Text style={styles.microCardName}>Vitamin C</Text>
                <Text style={[styles.microCardStatus, { color: '#2E7D32' }]}>
                  Optimal Level
                </Text>
              </View>

              {/* Card 2: Iron */}
              <View style={styles.microCard}>
                <View style={styles.microCardTopRow}>
                  <View style={[styles.microIconBox, { backgroundColor: '#FEF6E9' }]}>
                    <Droplet size={16} color="#F39C12" />
                  </View>
                  <Text style={styles.microPercentText}>75%</Text>
                </View>
                <Text style={styles.microCardName}>Iron</Text>
                <View style={styles.miniBarTrack}>
                  <View style={[styles.miniBarFill, { width: '75%', backgroundColor: '#8B5A2B' }]} />
                </View>
              </View>

              {/* Card 3: Calcium */}
              <View style={[styles.microCard, { borderColor: '#FFE4CC', backgroundColor: '#FFFDFB' }]}>
                <View style={styles.microCardTopRow}>
                  <View style={[styles.microIconBox, { backgroundColor: '#FFF0E6' }]}>
                    <Text style={styles.microElementTag}>Ca</Text>
                  </View>
                  <AlertTriangle size={15} color="#C62828" />
                </View>
                <Text style={styles.microCardName}>Calcium</Text>
                <Text style={[styles.microCardStatus, { color: '#C62828' }]}>
                  Needs Boost
                </Text>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 6. 5-Tab Floating Bottom Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {/* Home Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Home size={22} color={activeTab === 'home' ? '#FF5B00' : '#8C7B73'} strokeWidth={2.2} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          {/* Diary Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('diary')}
            activeOpacity={0.7}
          >
            <Calendar size={22} color={activeTab === 'diary' ? '#FF5B00' : '#8C7B73'} />
            <Text style={[styles.tabLabel, activeTab === 'diary' && styles.tabLabelActive]}>
              Diary
            </Text>
          </TouchableOpacity>

          {/* Center Scan Raised Button */}
          <View style={styles.centerScanWrapper}>
            <TouchableOpacity
              style={styles.centerScanButton}
              onPress={() => setIsScannerOpen(true)}
              activeOpacity={0.85}
            >
              <Camera size={26} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={[styles.tabLabel, { color: '#FF5B00', marginTop: 4 }]}>
              Scan
            </Text>
          </View>

          {/* Insights Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('insights')}
            activeOpacity={0.7}
          >
            <Activity size={22} color={activeTab === 'insights' ? '#FF5B00' : '#8C7B73'} />
            <Text style={[styles.tabLabel, activeTab === 'insights' && styles.tabLabelActive]}>
              Insights
            </Text>
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <UserIcon size={22} color={activeTab === 'profile' ? '#FF5B00' : '#8C7B73'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110, // Generous breathing room above floating tab bar
  },
  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFE2D1',
    opacity: 0.6,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FDECD2',
    opacity: 0.5,
  },

  // 1. Top App Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFDBC2',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B4513',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#FF5B00',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF5B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  signOutPopover: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 100,
  },
  popoverEmail: {
    fontSize: 12,
    color: '#8C7B73',
    marginBottom: 8,
  },
  popoverSignOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  popoverSignOutText: {
    color: '#FF5B00',
    fontWeight: '700',
    fontSize: 12,
  },

  // 2. Greeting & Streak
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2A1810',
  },
  greetingSubtitle: {
    fontSize: 13.5,
    color: '#7D6E66',
    marginTop: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFDBC2',
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF5B00',
  },

  // 3. Hero Circular Calorie Gauge
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  gaugeSvgWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCalories: {
    fontSize: 34,
    fontWeight: '800',
    color: '#8B4513',
    letterSpacing: -0.5,
  },
  gaugeTarget: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C7B73',
    marginTop: 1,
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },

  // 4. Daily Macros Card
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 20,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  macroCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1810',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1810',
  },
  macroNumbers: {
    fontSize: 13,
    color: '#8C7B73',
  },
  macroBold: {
    fontWeight: '800',
    color: '#2A1810',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F5ECE5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // 5. Micronutrients Snapshot
  microSection: {
    marginBottom: 12,
  },
  microHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  microTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  microSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1810',
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8B4513',
  },
  microCardsScroll: {
    gap: 12,
  },
  microCard: {
    width: 125,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  microCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  microIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F39C12',
  },
  microElementTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5B00',
  },
  microCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 4,
  },
  microCardStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniBarTrack: {
    height: 4,
    backgroundColor: '#F5ECE5',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // 6. 5-Tab Floating Bottom Navigation Bar
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8C7B73',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#FF5B00',
  },
  centerScanWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    flex: 1,
  },
  centerScanButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF5B00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
});
