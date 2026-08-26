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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  analyzeFoodImages,
  FoodAnalysisResult,
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
  X,
  Plus,
  ChevronDown,
  Lightbulb,
} from '../components/ui/LucideIcons';

const { width, height } = Dimensions.get('window');

// High-resolution multi-angle food photos for instant testing before EAS dev rebuild
const FALLBACK_TEST_PHOTOS = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80', // Angle 1: Main Salad & Quinoa Plate
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=80', // Angle 2: Salmon & Veggie Portion Depth
  'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=900&q=80', // Angle 3: Healthy Smoothie & Drink
];

interface ScannerScreenProps {
  onClose: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onClose }) => {
  const { addMealLog } = useNutrition();

  // Mode: 'camera' | 'manual'
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [flashEnabled, setFlashEnabled] = useState(false);

  // 3-Slot Recent Captures (1 to 3 images)
  const [capturedImages, setCapturedImages] = useState<Array<{ uri: string; base64?: string }>>([]);

  // Scanning & Result state
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
          toValue: 220,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validImagesCount = capturedImages.length;

  /**
   * Safely loads expo-image-picker without throwing unhandled native module exceptions.
   */
  const getSafeImagePicker = () => {
    try {
      const IP = require('expo-image-picker');
      if (IP && (IP.launchCameraAsync || IP.launchImageLibraryAsync)) {
        return IP;
      }
    } catch {
      // Native module not linked in current APK
    }
    return null;
  };

  // 1. Shutter Snap (Fills next open slot up to 3)
  const handleShutterSnap = async () => {
    if (capturedImages.length >= 3) {
      Alert.alert('3 Slots Filled', 'You have captured all 3 photo slots. Tap Analyze or remove a photo to retake.');
      return;
    }

    const ImagePicker = getSafeImagePicker();

    // If native module is compiled into the APK, launch native camera
    if (ImagePicker && ImagePicker.launchCameraAsync) {
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera Permission', 'Please allow camera access to take food photos.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          setCapturedImages((prev) => [
            ...prev,
            { uri: result.assets[0].uri, base64: result.assets[0].base64 || '' },
          ]);
          return;
        }
      } catch (cameraErr) {
        console.warn('Native camera capture error:', cameraErr);
      }
    }

    // Fallback: Seamlessly docks a test meal angle photo for instant multi-image testing
    const nextPhotoIndex = capturedImages.length % FALLBACK_TEST_PHOTOS.length;
    const testPhotoUri = FALLBACK_TEST_PHOTOS[nextPhotoIndex];
    setCapturedImages((prev) => [...prev, { uri: testPhotoUri }]);
  };

  // 2. Photo Gallery Picker (Fills next open slot up to 3)
  const handlePickFromGallery = async () => {
    if (capturedImages.length >= 3) {
      Alert.alert('3 Slots Filled', 'You have captured all 3 photo slots. Tap Analyze or remove a photo to retake.');
      return;
    }

    const ImagePicker = getSafeImagePicker();

    if (ImagePicker && ImagePicker.launchImageLibraryAsync) {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Photo Access', 'Please allow photo library access to select food photos.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: false,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          setCapturedImages((prev) => [
            ...prev,
            { uri: result.assets[0].uri, base64: result.assets[0].base64 || '' },
          ]);
          return;
        }
      } catch (galleryErr) {
        console.warn('Native gallery picker error:', galleryErr);
      }
    }

    // Fallback photo
    const nextPhotoIndex = (capturedImages.length + 1) % FALLBACK_TEST_PHOTOS.length;
    const testPhotoUri = FALLBACK_TEST_PHOTOS[nextPhotoIndex];
    setCapturedImages((prev) => [...prev, { uri: testPhotoUri }]);
  };

  // Remove a photo from the 3-slot dock
  const handleRemovePhoto = (indexToRemove: number) => {
    setCapturedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 3. Process Multi-Angle Food Images with Gemini AI
  const handleAnalyzeMultiImages = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('Snap Food Photo', 'Please take at least 1 photo before analyzing.');
      return;
    }

    try {
      setIsScanning(true);
      const foodData = await analyzeFoodImages(capturedImages);
      setAnalysisResult(foodData);
      setIsResultModalOpen(true);
    } catch (err: any) {
      console.warn('Multi-image food scan error:', err);
      Alert.alert('Scan Failed', err?.message || 'Could not analyze food images. Please check your Supabase Edge Function secrets.');
    } finally {
      setIsScanning(false);
    }
  };

  // 4. Submit Manual Entry
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

  // 5. Action 1: Add to Daily Tracker
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
      source: activeMode === 'camera' ? 'ai_scan' : 'manual',
    });

    setIsResultModalOpen(false);
    onClose(); // Return to dashboard
  };

  // 6. Action 2: Just Checking (Dismiss without adding)
  const handleDismissResult = () => {
    setIsResultModalOpen(false);
    setAnalysisResult(null);
  };

  return (
    <View style={styles.fullscreenContainer}>
      <StatusBar style="light" />

      {/* ============================================================ */}
      {/* MODE 1: ULTRA-CLEAN CAMERA VIEWFINDER (Matching Reference)   */}
      {/* ============================================================ */}
      {activeMode === 'camera' && (
        <View style={styles.viewfinderBackground}>
          {/* Subtle Ambient Vignette & Warm Depth */}
          <View style={styles.ambientTopGlow} pointerEvents="none" />
          <View style={styles.ambientBottomGlow} pointerEvents="none" />

          {/* Top Bar (Close Button, Mode Pill, Flash) */}
          <SafeAreaView edges={['top']} style={styles.topBarSafe}>
            <View style={styles.topBar}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.circularGlassButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Center Mode Pill */}
              <View style={styles.centerModePill}>
                <UtensilsCrossed size={14} color="#FFFFFF" />
                <Text style={styles.centerModeText}>Multi-Item Plate</Text>
                <ChevronDown size={14} color="#FFFFFF" />
              </View>

              {/* Flash Toggle */}
              <TouchableOpacity
                style={[styles.circularGlassButton, flashEnabled && styles.flashButtonActive]}
                onPress={() => setFlashEnabled(!flashEnabled)}
                activeOpacity={0.7}
              >
                <Zap
                  size={18}
                  color={flashEnabled ? '#FF5B00' : '#FFFFFF'}
                  fill={flashEnabled ? '#FF5B00' : 'none'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Center Reticle Focus Box */}
          <View style={styles.centerReticleContainer}>
            <View style={styles.reticleFrame}>
              {/* Animated Laser Scan Line */}
              <Animated.View
                style={[
                  styles.laserScanLine,
                  {
                    transform: [{ translateY: scanLineAnim }],
                  },
                ]}
              />
            </View>

            {/* Subtle Guidance Pill */}
            <View style={styles.hintPill}>
              <Lightbulb size={13} color="#FFDBC2" />
              <Text style={styles.hintPillText}>Keep dish centered in clear light</Text>
            </View>
          </View>

          {/* Bottom Dock & Shutter Controls */}
          <SafeAreaView edges={['bottom']} style={styles.bottomControlsSafe}>
            {/* FLOATING 3-SLOT RECENT CAPTURES DOCK */}
            <View style={styles.capturesDockWrapper}>
              {/* Analyze Button (Active as soon as 1+ photo is docked) */}
              {validImagesCount > 0 && (
                <TouchableOpacity
                  style={styles.floatingAnalyzeButton}
                  onPress={handleAnalyzeMultiImages}
                  disabled={isScanning}
                  activeOpacity={0.85}
                >
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.floatingAnalyzeText}>
                    Analyze Meal ({validImagesCount}/3)
                  </Text>
                </TouchableOpacity>
              )}

              {/* 3-Thumbnail Tray */}
              <View style={styles.thumbnailsTray}>
                {[0, 1, 2].map((slotIdx) => {
                  const item = capturedImages[slotIdx];
                  const imageUri = item?.uri;

                  return (
                    <View key={slotIdx} style={styles.thumbnailSlot}>
                      {imageUri ? (
                        <View style={styles.filledThumbBox}>
                          <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
                          <TouchableOpacity
                            style={styles.thumbDeleteButton}
                            onPress={() => handleRemovePhoto(slotIdx)}
                            activeOpacity={0.7}
                          >
                            <X size={10} color="#FFFFFF" strokeWidth={3} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.emptyThumbBox}
                          onPress={handleShutterSnap}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color="rgba(255, 255, 255, 0.45)" strokeWidth={2.2} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Shutter Bar Controls */}
            <View style={styles.shutterControlsRow}>
              {/* Photo Gallery Picker */}
              <TouchableOpacity
                style={styles.sideControlButton}
                onPress={handlePickFromGallery}
                activeOpacity={0.75}
              >
                <ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>

              {/* Center Shutter Button (Dual-Ring) */}
              <TouchableOpacity
                style={styles.shutterOuterRing}
                onPress={handleShutterSnap}
                activeOpacity={0.85}
              >
                <View style={styles.shutterInnerCore} />
              </TouchableOpacity>

              {/* Switch to Manual Input */}
              <TouchableOpacity
                style={styles.sideControlButton}
                onPress={() => setActiveMode('manual')}
                activeOpacity={0.75}
              >
                <UtensilsCrossed size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* ============================================================ */}
      {/* MODE 2: CLEAN MANUAL INPUT FORM                              */}
      {/* ============================================================ */}
      {activeMode === 'manual' && (
        <SafeAreaView style={styles.manualSafeArea}>
          <View style={styles.manualHeader}>
            <TouchableOpacity
              onPress={() => setActiveMode('camera')}
              style={styles.manualBackButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#2A1810" />
            </TouchableOpacity>
            <Text style={styles.manualHeaderTitle}>Manual Entry</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.manualScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.manualCard}>
              <Text style={styles.manualCardHeading}>Log Nutrition Details</Text>
              <Text style={styles.manualCardSubtitle}>
                Directly input meal details to update today's macros.
              </Text>

              {/* Meal Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>MEAL / DISH NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Grilled Chicken Quinoa Bowl"
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
                  placeholder="e.g. 540"
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
                    placeholder="38"
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
                    placeholder="16"
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
          </ScrollView>
        </SafeAreaView>
      )}

      {/* Scanning Fullscreen Loading Overlay */}
      {isScanning && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF5B00" />
            <Text style={styles.loadingTitle}>Analyzing Nutrition...</Text>
            <Text style={styles.loadingSubtitle}>
              Processing {validImagesCount} angle{validImagesCount > 1 ? 's' : ''} with Gemini 3.5 Flash
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
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#140D09',
  },

  // Viewfinder
  viewfinderBackground: {
    flex: 1,
    backgroundColor: '#1E1610',
    justifyContent: 'space-between',
    position: 'relative',
  },
  ambientTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(255, 91, 0, 0.08)',
  },
  ambientBottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(20, 13, 9, 0.85)',
  },

  // Top Bar
  topBarSafe: {
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circularGlassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  flashButtonActive: {
    backgroundColor: 'rgba(255, 91, 0, 0.25)',
    borderColor: '#FF5B00',
  },
  centerModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  centerModeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Reticle
  centerReticleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  reticleFrame: {
    width: width * 0.78,
    height: 250,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FF5B00',
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 91, 0, 0.03)',
  },
  laserScanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#FF5B00',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  hintPillText: {
    color: '#FAF6F0',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bottom Controls
  bottomControlsSafe: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    zIndex: 10,
  },
  capturesDockWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  floatingAnalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5B00',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingAnalyzeText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  thumbnailsTray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailSlot: {
    width: 52,
    height: 52,
  },
  emptyThumbBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledThumbBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FF5B00',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDeleteButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(42, 24, 16, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shutter Controls
  shutterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sideControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterInnerCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF5B00',
  },

  // Manual Form
  manualSafeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  manualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  manualBackButton: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  manualHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
  },
  headerSpacer: {
    width: 36,
  },
  manualScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  manualCardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 4,
  },
  manualCardSubtitle: {
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
  primaryActionButton: {
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

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 13, 9, 0.8)',
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
    width: '82%',
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
