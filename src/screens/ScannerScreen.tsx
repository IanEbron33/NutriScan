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
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  analyzeFoodImages,
  FoodAnalysisResult,
} from '../services/aiFoodScanner';
import { useNutrition } from '../context/NutritionContext';
import { NutritionResultModal } from '../components/scanner/NutritionResultModal';
import { MealContextNoteModal } from '../components/scanner/MealContextNoteModal';
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
  Lightbulb,
  ShieldCheck,
  ScanLine,
  Flame,
  FileText,
} from '../components/ui/LucideIcons';

const { width, height } = Dimensions.get('window');

interface ScannerScreenProps {
  onClose: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onClose }) => {
  const { addMealLog } = useNutrition();

  // Camera permissions & ref
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Mode: 'camera' | 'manual'
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [flashEnabled, setFlashEnabled] = useState(false);

  // 3-Slot Recent Captures (1 to 3 images)
  const [capturedImages, setCapturedImages] = useState<Array<{ uri: string; base64?: string }>>([]);

  // Scanning & Result state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Optional Context Note State
  const [userNotes, setUserNotes] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Manual Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  // Custom Warm In-App Toast
  const [scannerToast, setScannerToast] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'warning' } | null>(null);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const showToast = (title: string, message: string, type: 'info' | 'error' | 'warning' = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setScannerToast({ title, message, type });
    toastTimer.current = setTimeout(() => {
      setScannerToast(null);
    }, 3200);
  };

  // Laser scanner, loading radar spin & floating card animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const stepTextFadeAnim = useRef(new Animated.Value(1)).current;

  // Step cycling, radar spin & floating card entry during scanning
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setScanStepIndex(0);

      // Slide & fade up floating bottom card
      slideUpAnim.setValue(50);
      cardFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideUpAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous radar spin
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      interval = setInterval(() => {
        // Step text cross-fade
        Animated.sequence([
          Animated.timing(stepTextFadeAnim, {
            toValue: 0.2,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(stepTextFadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        setScanStepIndex((prev) => (prev < 2 ? prev + 1 : 0));
      }, 1200);
    } else {
      slideUpAnim.setValue(50);
      cardFadeAnim.setValue(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

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

  // 1. Shutter Snap (Takes photo directly from live CameraView or native camera)
  const handleShutterSnap = async () => {
    if (capturedImages.length >= 3) {
      showToast('3 Slots Filled', 'You have captured all 3 photo slots. Tap Analyze or remove a photo to retake.', 'info');
      return;
    }

    // A. Primary: In-app live camera snapshot via CameraView
    if (cameraRef.current && cameraRef.current.takePictureAsync) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: false,
        });

        if (photo?.uri) {
          setCapturedImages((prev) => [
            ...prev,
            { uri: photo.uri, base64: photo.base64 || '' },
          ]);
          return;
        }
      } catch (camErr) {
        console.warn('In-app CameraView takePictureAsync notice:', camErr);
      }
    }

    // B. Fallback: Native system camera intent via expo-image-picker
    const ImagePicker = getSafeImagePicker();
    if (ImagePicker && ImagePicker.launchCameraAsync) {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.granted) {
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
        }
      } catch (cameraErr) {
        console.warn('Native camera fallback error:', cameraErr);
      }
    }

    showToast('Capture Failed', 'Could not take photo. Please check camera permissions or select a photo from your gallery.', 'error');
  };

  // 2. Photo Gallery Picker (Fills next open slot up to 3)
  const handlePickFromGallery = async () => {
    if (capturedImages.length >= 3) {
      showToast('3 Slots Filled', 'You have captured all 3 photo slots. Tap Analyze or remove a photo to retake.', 'info');
      return;
    }

    const ImagePicker = getSafeImagePicker();

    if (ImagePicker && ImagePicker.launchImageLibraryAsync) {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showToast('Photo Access Required', 'Please allow photo library access to select food photos.', 'warning');
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
        showToast('Gallery Error', 'Could not select photo from gallery.', 'error');
      }
    }
  };

  // Remove a photo from the 3-slot dock
  const handleRemovePhoto = (indexToRemove: number) => {
    setCapturedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // 3. Process Multi-Angle Food Images with Gemini AI
  const handleAnalyzeMultiImages = async () => {
    if (capturedImages.length === 0) {
      showToast('Snap Food Photo', 'Please take at least 1 photo before analyzing.', 'warning');
      return;
    }

    try {
      setIsScanning(true);
      const foodData = await analyzeFoodImages(capturedImages, userNotes);
      setAnalysisResult(foodData);
      setIsResultModalOpen(true);
    } catch (err: any) {
      console.warn('Multi-image food scan error:', err);
      showToast('Scan Failed', err?.message || 'Could not analyze food images. Please check your Supabase Edge Function secrets.', 'error');
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
      showToast('Invalid Input', 'Please provide a meal title and positive calories.', 'warning');
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

  // Permission Request View (Rendered when camera permission is explicitly denied)
  if (activeMode === 'camera' && permission && !permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar style="dark" />
        <View style={styles.permissionCard}>
          <View style={styles.permissionIconBadge}>
            <Camera size={34} color="#FF5B00" />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionDescription}>
            NutriScan needs camera access to scan food dishes and calculate nutritional macros in real-time.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionSecondaryButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.permissionSecondaryText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.fullscreenContainer}>
      <StatusBar style="light" />

      {/* ============================================================ */}
      {/* MODE 1: LIVE IN-APP CAMERA VIEWFINDER (`expo-camera`)         */}
      {/* ============================================================ */}
      {activeMode === 'camera' && (
        <View style={styles.viewfinderBackground}>
          {/* Live In-App Camera Feed Stream */}
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={flashEnabled}
            mode="picture"
          />

          {/* Subtle Ambient Vignette & Depth Mask */}
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

              {/* Center Mode Pill (Clean Badge) */}
              <View style={styles.centerModePill}>
                <UtensilsCrossed size={14} color="#FFFFFF" />
                <Text style={styles.centerModeText}>Multi-Item Plate</Text>
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

            {/* Custom Warm Scanner Toast Notification */}
            {scannerToast && (
              <View style={styles.toastBanner}>
                <View style={styles.toastIconBox}>
                  {scannerToast.type === 'error' ? (
                    <X size={14} color="#C62828" strokeWidth={2.5} />
                  ) : scannerToast.type === 'warning' ? (
                    <Zap size={14} color="#FF5B00" strokeWidth={2.2} />
                  ) : (
                    <Sparkles size={14} color="#FF5B00" strokeWidth={2.2} />
                  )}
                </View>
                <View style={styles.toastTextCol}>
                  <Text style={styles.toastTitle}>{scannerToast.title}</Text>
                  <Text style={styles.toastMessage}>{scannerToast.message}</Text>
                </View>
              </View>
            )}
          </SafeAreaView>

          {/* Center Reticle Focus Box */}
          <View style={styles.centerReticleContainer}>
            <View style={[styles.reticleFrame, validImagesCount > 0 && styles.reticleFrameWithImage]}>
              {/* Animated Laser Scan Line */}
              <Animated.View
                style={[
                  styles.laserScanLine,
                  {
                    transform: [{ translateY: scanLineAnim }],
                  },
                ]}
              />

              {/* Angle Count Badge */}
              {validImagesCount > 0 && (
                <View style={styles.reticleTagBadge}>
                  <Text style={styles.reticleTagText}>
                    Angle {validImagesCount} of 3 Captured
                  </Text>
                </View>
              )}
            </View>

            {/* Subtle Guidance Pill */}
            <View style={styles.hintPill}>
              <Lightbulb size={13} color="#FFDBC2" />
              <Text style={styles.hintPillText}>
                {validImagesCount > 0
                  ? 'Photo ready! Tap Analyze or snap another angle.'
                  : 'Keep dish centered in clear light'}
              </Text>
            </View>
          </View>

          {/* Bottom Dock & Shutter Controls */}
          <SafeAreaView edges={['bottom']} style={styles.bottomControlsSafe}>
            {/* FLOATING 3-SLOT RECENT CAPTURES DOCK */}
            <View style={styles.capturesDockWrapper}>
              {/* Split Action Bar: Analyze Button + Compact Note Button (Option A) */}
              {validImagesCount > 0 && (
                <View style={styles.analyzeActionBarRow}>
                  <TouchableOpacity
                    style={styles.floatingAnalyzeButton}
                    onPress={handleAnalyzeMultiImages}
                    disabled={isScanning}
                    activeOpacity={0.85}
                  >
                    <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.floatingAnalyzeText}>
                      Analyze Meal ({validImagesCount}/3)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.noteTriggerButton,
                      userNotes.trim().length > 0 && styles.noteTriggerButtonActive,
                    ]}
                    onPress={() => setIsNoteModalOpen(true)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <FileText
                      size={18}
                      color={userNotes.trim().length > 0 ? '#FFFFFF' : '#FFDBC2'}
                      strokeWidth={2.2}
                    />
                    {userNotes.trim().length > 0 && (
                      <View style={styles.noteActiveIndicatorDot} />
                    )}
                  </TouchableOpacity>
                </View>
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
                <View style={styles.inputWithIconWrapper}>
                  <View style={styles.inputIconBox}>
                    <UtensilsCrossed size={16} color="#FF5B00" />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. Grilled Chicken Bowl"
                    placeholderTextColor="#A89A92"
                    value={manualTitle}
                    onChangeText={setManualTitle}
                  />
                </View>
              </View>

              {/* Calories */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CALORIES (KCAL)</Text>
                <View style={styles.inputWithIconWrapper}>
                  <View style={styles.inputIconBox}>
                    <Flame size={16} color="#FF5B00" fill="#FF5B00" />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. 540"
                    placeholderTextColor="#A89A92"
                    keyboardType="numeric"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                  />
                </View>
              </View>

              {/* 3 Macro Fields in Row */}
              <View style={styles.macrosSection}>
                <Text style={styles.inputLabel}>MACRONUTRIENTS (GRAMS)</Text>
                <View style={styles.macrosInputRow}>
                  {/* Protein */}
                  <View style={[styles.macroInputCol, { backgroundColor: '#FFFDFD', borderColor: '#FCDAD7' }]}>
                    <View style={styles.macroColHeader}>
                      <View style={[styles.macroDot, { backgroundColor: '#E54D42' }]} />
                      <Text style={[styles.macroColLabel, { color: '#E54D42' }]}>Protein</Text>
                    </View>
                    <View style={styles.macroValRow}>
                      <TextInput
                        style={styles.macroTextInput}
                        placeholder="38"
                        placeholderTextColor="#C4B5AC"
                        keyboardType="numeric"
                        value={manualProtein}
                        onChangeText={setManualProtein}
                      />
                      <Text style={styles.macroUnitText}>g</Text>
                    </View>
                  </View>

                  {/* Carbs */}
                  <View style={[styles.macroInputCol, { backgroundColor: '#FFFDFB', borderColor: '#FDEFD7' }]}>
                    <View style={styles.macroColHeader}>
                      <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                      <Text style={[styles.macroColLabel, { color: '#D97706' }]}>Carbs</Text>
                    </View>
                    <View style={styles.macroValRow}>
                      <TextInput
                        style={styles.macroTextInput}
                        placeholder="45"
                        placeholderTextColor="#C4B5AC"
                        keyboardType="numeric"
                        value={manualCarbs}
                        onChangeText={setManualCarbs}
                      />
                      <Text style={styles.macroUnitText}>g</Text>
                    </View>
                  </View>

                  {/* Fat */}
                  <View style={[styles.macroInputCol, { backgroundColor: '#FAF8F5', borderColor: '#EFE7DF' }]}>
                    <View style={styles.macroColHeader}>
                      <View style={[styles.macroDot, { backgroundColor: '#8B5A2B' }]} />
                      <Text style={[styles.macroColLabel, { color: '#8B5A2B' }]}>Fats</Text>
                    </View>
                    <View style={styles.macroValRow}>
                      <TextInput
                        style={styles.macroTextInput}
                        placeholder="16"
                        placeholderTextColor="#C4B5AC"
                        keyboardType="numeric"
                        value={manualFat}
                        onChangeText={setManualFat}
                      />
                      <Text style={styles.macroUnitText}>g</Text>
                    </View>
                  </View>
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

      {/* Scanning Floating Bottom Scanner Card (Option A - White Theme) */}
      {isScanning && (
        <View style={styles.floatingScanningOverlay} pointerEvents="auto">
          <Animated.View
            style={[
              styles.bottomScannerCard,
              {
                opacity: cardFadeAnim,
                transform: [{ translateY: slideUpAnim }],
              },
            ]}
          >
            {/* Top Row: Rotating AI Radar Ring + Title & Step Info */}
            <View style={styles.scannerCardTopRow}>
              {/* Rotating AI Pulse Radar */}
              <View style={styles.scannerRadarWrapper}>
                <Animated.View
                  style={[
                    styles.scannerRadarSpinRing,
                    {
                      transform: [
                        {
                          rotate: spinAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.scannerRadarCore}>
                  {scanStepIndex === 0 && <ScanLine size={20} color="#FF5B00" />}
                  {scanStepIndex === 1 && <UtensilsCrossed size={20} color="#FF5B00" />}
                  {scanStepIndex === 2 && <Sparkles size={20} color="#FF5B00" />}
                </View>
              </View>

              {/* Headline & Dynamic Step */}
              <View style={styles.scannerCardTextCol}>
                <Text style={styles.scannerHeadline}>Analyzing Meal...</Text>

                <Animated.Text
                  style={[styles.scannerStepSubtitle, { opacity: stepTextFadeAnim }]}
                  numberOfLines={1}
                >
                  {scanStepIndex === 0
                    ? 'Inspecting dish and portion volume...'
                    : scanStepIndex === 1
                    ? 'Identifying ingredients & food items...'
                    : 'Calculating calories & nutritional macros...'}
                </Animated.Text>
              </View>
            </View>

            {/* 3-Step Pill Progress Track */}
            <View style={styles.stepProgressRow}>
              {[0, 1, 2].map((stepIdx) => (
                <View
                  key={stepIdx}
                  style={[
                    styles.stepProgressBar,
                    stepIdx <= scanStepIndex ? styles.stepProgressBarActive : styles.stepProgressBarInactive,
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      )}

      {/* Nutrition Breakdown Result Modal (Inspect vs Log) */}
      <NutritionResultModal
        visible={isResultModalOpen}
        result={analysisResult}
        onAddToDailyTracker={handleConfirmAddToDaily}
        onDismiss={handleDismissResult}
      />

      {/* Meal Context Note Modal (Option A) */}
      <MealContextNoteModal
        visible={isNoteModalOpen}
        initialNote={userNotes}
        onSave={(note) => setUserNotes(note)}
        onClose={() => setIsNoteModalOpen(false)}
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
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 246, 240, 0.96)',
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FFE0CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  toastIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  toastMessage: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7D6E66',
    marginTop: 1,
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
  reticleFrameWithImage: {
    borderStyle: 'solid',
    borderColor: '#FF5B00',
    backgroundColor: 'transparent',
  },
  reticlePreviewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  reticleTagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(42, 24, 16, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 91, 0, 0.5)',
  },
  reticleTagText: {
    color: '#FAF6F0',
    fontSize: 11,
    fontWeight: '700',
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
  analyzeActionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  floatingAnalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5B00',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
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
  noteTriggerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  noteTriggerButtonActive: {
    backgroundColor: '#FF5B00',
    borderColor: '#FFA066',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  noteActiveIndicatorDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF5B00',
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
    paddingVertical: 14,
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  manualCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  manualCardHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 4,
  },
  manualCardSubtitle: {
    fontSize: 13,
    color: '#8C7B73',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  inputWithIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    paddingHorizontal: 12,
  },
  inputIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  macrosSection: {
    marginBottom: 22,
  },
  macrosInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroInputCol: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  macroColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroColLabel: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  macroValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  macroTextInput: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
    textAlign: 'center',
    minWidth: 32,
    paddingVertical: 2,
  },
  macroUnitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7B73',
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

  // Floating Bottom Scanner Loading Card (Option A)
  floatingScanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 10, 7, 0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 26,
    zIndex: 1000,
  },
  bottomScannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    gap: 14,
  },
  scannerCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  scannerRadarWrapper: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scannerRadarSpinRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FF5B00',
    borderStyle: 'dashed',
  },
  scannerRadarCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFDBC2',
  },
  scannerCardTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  scannerHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 4,
  },
  scannerStepSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7D6E66',
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  stepProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepProgressBarActive: {
    backgroundColor: '#FF5B00',
  },
  stepProgressBarInactive: {
    backgroundColor: '#EFE7DF',
  },

  // Permission Card
  permissionContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  permissionIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#7D6E66',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#FF5B00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  permissionSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  permissionSecondaryText: {
    color: '#8C7B73',
    fontSize: 14,
    fontWeight: '600',
  },
});
