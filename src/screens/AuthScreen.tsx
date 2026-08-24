import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { GoogleButton } from '../components/ui/GoogleButton';
import {
  UtensilsCrossed,
  ScanLine,
  PieChart,
  Target,
  ShieldCheck,
  Sparkles,
} from '../components/ui/LucideIcons';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, isGoogleLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed. Please try again.');
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" translucent={false} />

      {/* Ambient Decorative Background Elements */}
      <View style={styles.ambientGlowTopRight} pointerEvents="none" />
      <View style={styles.ambientGlowBottomLeft} pointerEvents="none" />
      <View style={styles.ambientGlowCenter} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* 1. Brand & Welcome Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoBadgeOuter}>
                <View style={styles.logoBadgeInner}>
                  <UtensilsCrossed size={28} color="#FF5B00" />
                </View>
              </View>
            </View>

            <View style={styles.brandPill}>
              <Sparkles size={13} color="#FF5B00" />
              <Text style={styles.brandTitle}>NUTRISCAN AI</Text>
            </View>

            <Text style={styles.mainHeading}>Welcome to NutriScan</Text>
            <Text style={styles.subHeading}>
              AI-powered nutrition & portion intelligence in seconds.
            </Text>
          </View>

          {/* 2. Primary Action: Google 1-Tap Button (Positioned on Top) */}
          <View style={styles.actionContainer}>
            <GoogleButton
              onPress={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            />

            <View style={styles.trustBadge}>
              <ShieldCheck size={15} color="#2E7D32" />
              <Text style={styles.trustBadgeText}>
                1-Tap Instant Sign-In • No Password Needed
              </Text>
            </View>
          </View>

          {/* Error Notification */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* 3. Feature Highlights Card (Below Google Button) */}
          <View style={styles.featuresContainer}>
            <View style={styles.featuresHeaderRow}>
              <Text style={styles.featuresSectionLabel}>WHAT YOU GET INSIDE</Text>
            </View>

            <View style={styles.featuresCard}>
              {/* Feature 1 */}
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#FFF0E6' }]}>
                  <ScanLine size={20} color="#FF5B00" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Instant AI Food Scan</Text>
                  <Text style={styles.featureDescription}>
                    Identify dishes and portion weights with your camera
                  </Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              {/* Feature 2 */}
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#FEF6E9' }]}>
                  <PieChart size={20} color="#F39C12" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Smart Macro Breakdown</Text>
                  <Text style={styles.featureDescription}>
                    Real-time protein, carbs, fats & hidden oil estimation
                  </Text>
                </View>
              </View>

              <View style={styles.featureDivider} />

              {/* Feature 3 */}
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Target size={20} color="#2E7D32" />
                </View>
                <View style={styles.featureTextBox}>
                  <Text style={styles.featureTitle}>Daily Goal Intelligence</Text>
                  <Text style={styles.featureDescription}>
                    Track daily calories, macros, and maintain your streak
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. Footer Legal Notice */}
          <View style={styles.footerSection}>
            <Text style={styles.legalNotice}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    position: 'relative',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  /* Ambient Background Accents */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FFE2D1',
    opacity: 0.65,
  },
  ambientGlowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FDECD2',
    opacity: 0.55,
  },
  ambientGlowCenter: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF2EB',
    opacity: 0.4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  /* 1. Hero Section */
  heroSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoBadgeContainer: {
    marginBottom: 14,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  logoBadgeOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFEAD9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD4B8',
  },
  logoBadgeInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFDBC2',
    marginBottom: 10,
    gap: 6,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FF5B00',
  },
  mainHeading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#2A1810',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subHeading: {
    fontSize: 14,
    color: '#7D6E66',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 14,
  },
  /* 2. Action Area (Google on Top) */
  actionContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F3FAF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7EED9',
  },
  trustBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    width: '100%',
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  /* 3. Features Highlights Card */
  featuresContainer: {
    width: '100%',
    marginBottom: 12,
  },
  featuresHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  featuresSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#A89990',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#7D6E66',
    lineHeight: 16,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F7EFE8',
    marginVertical: 10,
  },
  /* 4. Footer */
  footerSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  legalNotice: {
    fontSize: 11.5,
    color: '#9C8E87',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
