import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import {
  analyzeFoodImage,
  FoodAnalysisResult,
  SAMPLE_PRESET_MEALS,
} from '../services/aiFoodScanner';
import { useNutrition } from '../context/NutritionContext';
import { NutritionResultModal } from '../components/scanner/NutritionResultModal';
import {
  Camera,
  ImageIcon,
  ArrowLeft,
  Sparkles,
  Zap,
  Check,
  UtensilsCrossed,
} from '../components/ui/LucideIcons';

interface ScannerScreenProps {
  onClose: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onClose }) => {
  const { addMealLog } = useNutrition();

  // Mode: 'ai_scan' | 'manual'
  const [activeMode, setActiveMode] = useState<'ai_scan' | 'manual'>('ai_scan');

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Manual Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Laser scanner animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 180,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // 1. Live Camera Capture
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission',
          'Please allow camera access to scan food dishes.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Initial compression before 1080p resizing
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        processFoodImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera launch error:', err);
    }
  };

  // 2. Photo Gallery Picker
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Access',
          'Please allow photo library access to select food photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        processFoodImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // 3. Process Food Image with Gemini AI
  const processFoodImage = async (uri: string) => {
    try {
      setIsScanning(true);
      const foodData = await analyzeFoodImage(uri);
      setAnalysisResult(foodData);
      setIsResultModalOpen(true);
    } catch (err) {
      console.warn('Food scan error:', err);
      Alert.alert('Scan Failed', 'Could not analyze food image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // 4. Quick Preset Test Meal
  const handleSelectPreset = (preset: FoodAnalysisResult) => {
    setAnalysisResult(preset);
    setIsResultModalOpen(true);
  };

  // 5. Submit Manual Entry
  const handleManualSubmit = () => {
    const cals = parseInt(manualCalories, 10);
    const p = parseInt(manualProtein, 10) || 0;
    const c = parseInt(manualCarbs, 10) || 0;
    const f = parseInt(manualFat, 10) || 0;

    if (!manualTitle.trim() || isNaN(cals) || cals <= 0) {
      Alert.alert('Invalid Input', 'Please provide a meal title and positive calories.');
      return;
    }

    const manualResult: FoodAnalysisResult = {
      dish_name: manualTitle.trim(),
      calories: cals,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
      micronutrients: {},
      health_insight: 'Custom manual macro entry.',
      confidence_score: 1.0,
      latency_ms: 10,
      source: 'preset',
    };

    setAnalysisResult(manualResult);
    setIsResultModalOpen(true);
  };

  // 6. Action 1: Add to Daily Tracker
  const handleConfirmAddToDaily = () => {
    if (!analysisResult) return;

    addMealLog({
      dish_name: analysisResult.dish_name,
      calories: analysisResult.calories,
      protein_g: analysisResult.protein_g,
      carbs_g: analysisResult.carbs_g,
      fat_g: analysisResult.fat_g,
      micronutrients: analysisResult.micronutrients,
      image_uri: analysisResult.image_uri,
      source: activeMode === 'ai_scan' ? 'ai_scan' : 'manual',
    });

    setIsResultModalOpen(false);
    onClose(); // Return to dashboard to see updated circular gauge & macro bars!
  };

  // 7. Action 2: Just Checking (Dismiss without adding)
  const handleDismissResult = () => {
    setIsResultModalOpen(false);
    setAnalysisResult(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Ambient Background Glow */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#2A1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Mode Switcher: AI Camera vs Manual Input */}
      <View style={styles.modeSwitcherContainer}>
        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'ai_scan' && styles.modeTabActive]}
          onPress={() => setActiveMode('ai_scan')}
          activeOpacity={0.8}
        >
          <Camera size={16} color={activeMode === 'ai_scan' ? '#FF5B00' : '#8C7B73'} />
          <Text style={[styles.modeTabText, activeMode === 'ai_scan' && styles.modeTabTextActive]}>
            AI Camera Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, activeMode === 'manual' && styles.modeTabActive]}
          onPress={() => setActiveMode('manual')}
          activeOpacity={0.8}
        >
          <UtensilsCrossed size={16} color={activeMode === 'manual' ? '#FF5B00' : '#8C7B73'} />
          <Text style={[styles.modeTabText, activeMode === 'manual' && styles.modeTabTextActive]}>
            Manual Input
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* MODE 1: AI CAMERA SCAN                                       */}
        {/* ============================================================ */}
        {activeMode === 'ai_scan' && (
          <View style={styles.aiScanContainer}>
            {/* Viewfinder Target Box */}
            <View style={styles.viewfinderBox}>
              {/* Corner Brackets */}
              <View style={[styles.cornerBracket, styles.topLeft]} />
              <View style={[styles.cornerBracket, styles.topRight]} />
              <View style={[styles.cornerBracket, styles.bottomLeft]} />
              <View style={[styles.cornerBracket, styles.bottomRight]} />

              {/* Animated Laser Scan Line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY: scanLineAnim }],
                  },
                ]}
              />

              {/* Viewfinder Center Icon */}
              <View style={styles.viewfinderCenter}>
                <Sparkles size={32} color="#FF5B00" />
                <Text style={styles.viewfinderHint}>
                  Position food dish inside frame
                </Text>
                <Text style={styles.viewfinderSubhint}>
                  1080p AI Vision • Gemini Flash-Lite
                </Text>
              </View>
            </View>

            {/* Camera & Gallery Action Buttons */}
            <View style={styles.actionButtonsRow}>
              {/* Take Photo */}
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleLaunchCamera}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                <Camera size={22} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.primaryActionText}>
                  {isScanning ? 'Analyzing...' : 'Snap Food Photo'}
                </Text>
              </TouchableOpacity>

              {/* Pick Gallery */}
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={handlePickFromGallery}
                disabled={isScanning}
                activeOpacity={0.8}
              >
                <ImageIcon size={20} color="#FF5B00" />
              </TouchableOpacity>
            </View>

            {/* Quick Test Dish Presets */}
            <View style={styles.presetSection}>
              <View style={styles.presetHeaderRow}>
                <Zap size={14} color="#FF5B00" fill="#FF5B00" />
                <Text style={styles.presetSectionTitle}>Or Tap a Quick Test Dish</Text>
              </View>

              <View style={styles.presetGrid}>
                {SAMPLE_PRESET_MEALS.map((meal, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetCard}
                    onPress={() => handleSelectPreset(meal)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: meal.image_uri }} style={styles.presetThumb} />
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName} numberOfLines={1}>
                        {meal.dish_name}
                      </Text>
                      <Text style={styles.presetCals}>
                        {meal.calories} kcal • {meal.protein_g}g P
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* MODE 2: MANUAL INPUT                                         */}
        {/* ============================================================ */}
        {activeMode === 'manual' && (
          <View style={styles.manualContainer}>
            <Text style={styles.manualHeading}>Log Custom Nutrition</Text>
            <Text style={styles.manualSubtitle}>
              Directly input meal details to update your daily macros.
            </Text>

            {/* Meal Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MEAL OR DISH NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Protein Oatmeal Bowl"
                placeholderTextColor="#A89A92"
                value={manualTitle}
                onChangeText={setManualTitle}
              />
            </View>

            {/* Calories */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CALORIES (KCAL)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 520"
                placeholderTextColor="#A89A92"
                keyboardType="numeric"
                value={manualCalories}
                onChangeText={setManualCalories}
              />
            </View>

            {/* 3 Macro Fields in Row */}
            <View style={styles.macrosInputRow}>
              {/* Protein */}
              <View style={styles.macroInputCol}>
                <Text style={[styles.inputLabel, { color: '#E54D42' }]}>PROTEIN (G)</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: '#FCDAD7' }]}
                  placeholder="30"
                  placeholderTextColor="#A89A92"
                  keyboardType="numeric"
                  value={manualProtein}
                  onChangeText={setManualProtein}
                />
              </View>

              {/* Carbs */}
              <View style={styles.macroInputCol}>
                <Text style={[styles.inputLabel, { color: '#F39C12' }]}>CARBS (G)</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: '#FDEFD7' }]}
                  placeholder="45"
                  placeholderTextColor="#A89A92"
                  keyboardType="numeric"
                  value={manualCarbs}
                  onChangeText={setManualCarbs}
                />
              </View>

              {/* Fat */}
              <View style={styles.macroInputCol}>
                <Text style={[styles.inputLabel, { color: '#8B5A2B' }]}>FAT (G)</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: '#EFE7DF' }]}
                  placeholder="14"
                  placeholderTextColor="#A89A92"
                  keyboardType="numeric"
                  value={manualFat}
                  onChangeText={setManualFat}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleManualSubmit}
              activeOpacity={0.85}
            >
              <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.primaryActionText}>Review & Log Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Scanning Fullscreen Loading Overlay */}
      {isScanning && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF5B00" />
            <Text style={styles.loadingTitle}>Analyzing Nutrition...</Text>
            <Text style={styles.loadingSubtitle}>
              Compressing to 1080p • Querying Gemini Flash-Lite
            </Text>
          </View>
        </View>
      )}

      {/* Nutrition Breakdown Result Modal (Inspect vs Log) */}
      <NutritionResultModal
        visible={isResultModalOpen}
        result={analysisResult}
        onAddToDailyTracker={handleConfirmAddToDaily}
        onDismiss={handleDismissResult}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
  },
  headerSpacer: {
    width: 36,
  },

  // Mode Switcher
  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE7DF',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C7B73',
  },
  modeTabTextActive: {
    color: '#FF5B00',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // AI Camera Viewfinder
  aiScanContainer: {
    alignItems: 'center',
  },
  viewfinderBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FF5B00',
  },
  topLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#FF5B00',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  viewfinderCenter: {
    alignItems: 'center',
    gap: 6,
  },
  viewfinderHint: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A1810',
    marginTop: 4,
  },
  viewfinderSubhint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7B73',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFDBC2',
  },

  // Presets
  presetSection: {
    width: '100%',
  },
  presetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  presetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.5,
  },
  presetGrid: {
    gap: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    gap: 12,
  },
  presetThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 2,
  },
  presetCals: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },

  // Manual Container
  manualContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  manualHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 4,
  },
  manualSubtitle: {
    fontSize: 13,
    color: '#8C7B73',
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#2A1810',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  macrosInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  macroInputCol: {
    flex: 1,
  },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42, 24, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    gap: 10,
    width: '80%',
  },
  loadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1810',
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#8C7B73',
    textAlign: 'center',
  },
});
