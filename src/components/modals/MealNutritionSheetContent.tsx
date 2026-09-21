import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import {
  Camera,
  X,
  Leaf,
  UtensilsCrossed,
  Sparkles,
  Clock,
} from '../ui/LucideIcons';

const { width } = Dimensions.get('window');

export interface DetectedItemData {
  name: string;
  portion?: string;
  estimated_grams?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MicronutrientsSheetData {
  fiber_g?: number;
  vitamin_c_mg?: number;
  iron_mg?: number;
  calcium_mg?: number;
  potassium_mg?: number;
  magnesium_mg?: number;
  vitamin_b6_mg?: number;
  zinc_mg?: number;
}

export interface MealNutritionSheetData {
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  image_uri?: string | null;
  image_uris?: string[];
  detected_items?: DetectedItemData[];
  micronutrients?: MicronutrientsSheetData;
  health_insight?: string;
  logged_at?: string;
}

interface MealNutritionSheetContentProps {
  data: MealNutritionSheetData;
  onClose: () => void;
  onCameraPress?: () => void;
  children?: React.ReactNode;
}

export const MealNutritionSheetContent: React.FC<MealNutritionSheetContentProps> = ({
  data,
  onClose,
  onCameraPress,
  children,
}) => {
  const {
    dish_name,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    image_uri,
    image_uris,
    detected_items = [],
    micronutrients,
    health_insight,
  } = data;

  // Segmented Pill Tab Switcher State
  const [activeTab, setActiveTab] = useState<'macros' | 'micros'>('macros');
  const [tabContainerWidth, setTabContainerWidth] = useState<number>(0);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const handleSwitchTab = (tab: 'macros' | 'micros') => {
    if (tab === activeTab) return;
    setActiveTab(tab);

    // 100% Hardware-Accelerated Native Driver Spring
    Animated.spring(tabAnim, {
      toValue: tab === 'macros' ? 0 : 1,
      useNativeDriver: true,
      friction: 12,
      tension: 120,
    }).start();
  };

  const pillWidth = tabContainerWidth > 0 ? (tabContainerWidth - 7) / 2 : (width - 32 - 7) / 2;
  const translateX = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillWidth],
  });

  // Caloric Macro Distribution with Fiber included (Recommendation 1)
  // Fiber provides ~2 kcal/g (clinical standard for dietary fiber fermentation)
  const fiberGrams = micronutrients?.fiber_g ?? 0;
  const proteinCals = Number(protein_g || 0) * 4;
  const fatCals = Number(fat_g || 0) * 9;
  const fiberCals = Number(fiberGrams || 0) * 2;
  const netCarbsGrams = Math.max(0, Number(carbs_g || 0) - Number(fiberGrams || 0));
  const carbsCals = netCarbsGrams * 4;
  const totalMacroCals = proteinCals + fatCals + carbsCals + fiberCals || calories || 1;

  let proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  let fatPct = Math.round((fatCals / totalMacroCals) * 100);
  let fiberPct = fiberGrams > 0 ? Math.max(1, Math.round((fiberCals / totalMacroCals) * 100)) : 0;
  let carbsPct = Math.max(0, 100 - proteinPct - fatPct - fiberPct);

  // Filter valid micronutrients to display in chips
  const microList: Array<{ label: string; value: string }> = [];
  if (micronutrients) {
    if (micronutrients.vitamin_c_mg !== undefined && micronutrients.vitamin_c_mg > 0) {
      microList.push({ label: 'Vitamin C', value: `${micronutrients.vitamin_c_mg} mg` });
    }
    if (micronutrients.iron_mg !== undefined && micronutrients.iron_mg > 0) {
      microList.push({ label: 'Iron', value: `${micronutrients.iron_mg} mg` });
    }
    if (micronutrients.calcium_mg !== undefined && micronutrients.calcium_mg > 0) {
      microList.push({ label: 'Calcium', value: `${micronutrients.calcium_mg} mg` });
    }
    if (micronutrients.potassium_mg !== undefined && micronutrients.potassium_mg > 0) {
      microList.push({ label: 'Potassium', value: `${micronutrients.potassium_mg} mg` });
    }
    if (micronutrients.magnesium_mg !== undefined && micronutrients.magnesium_mg > 0) {
      microList.push({ label: 'Magnesium', value: `${micronutrients.magnesium_mg} mg` });
    }
    if (micronutrients.vitamin_b6_mg !== undefined && micronutrients.vitamin_b6_mg > 0) {
      microList.push({ label: 'Vitamin B6', value: `${micronutrients.vitamin_b6_mg} mg` });
    }
    if (micronutrients.zinc_mg !== undefined && micronutrients.zinc_mg > 0) {
      microList.push({ label: 'Zinc', value: `${micronutrients.zinc_mg} mg` });
    }
    if (fiberGrams > 0) {
      microList.push({ label: 'Dietary Fiber', value: `${fiberGrams} g` });
    }
  }

  // Fallback intelligent ingredient items if detected_items is empty (e.g. older recorded meals)
  const displayItems: DetectedItemData[] =
    detected_items && detected_items.length > 0
      ? detected_items
      : [
          {
            name: dish_name || 'Primary Dish',
            portion: '1 serving',
            calories: Number(calories || 0),
            protein_g: Number(protein_g || 0),
            carbs_g: Number(carbs_g || 0),
            fat_g: Number(fat_g || 0),
          },
        ];

  // Format portion subline for ingredients
  const formatIngredientPortion = (item: DetectedItemData) => {
    const gramText = item.estimated_grams
      ? `${item.estimated_grams} g`
      : item.portion
      ? item.portion
      : '1 serving';
    return `${gramText} · P ${item.protein_g || 0} · C ${item.carbs_g || 0} · F ${item.fat_g || 0}`;
  };

  const primaryImageUri = image_uris && image_uris.length > 0 ? image_uris[0] : image_uri;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {/* ============================================================ */}
      {/* 1. TOP PHOTO HEADER WITH INTEGRATED DARK CHOCOLATE SCRIM     */}
      {/* ============================================================ */}
      <View style={styles.imageBannerWrapper}>
        {primaryImageUri ? (
          <Image source={{ uri: primaryImageUri }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <UtensilsCrossed size={40} color="#FF5B00" />
            <Text style={styles.placeholderText}>NutriScan Meal</Text>
          </View>
        )}

        {/* Dark Chocolate Linear Gradient Scrim over lower half */}
        <View style={styles.scrimContainer} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="darkChocolateScrim" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#2A1810" stopOpacity="0" />
                <Stop offset="0.30" stopColor="#2A1810" stopOpacity="0.40" />
                <Stop offset="0.75" stopColor="#2A1810" stopOpacity="0.82" />
                <Stop offset="1" stopColor="#2A1810" stopOpacity="0.94" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#darkChocolateScrim)" />
          </Svg>
        </View>

        {/* Floating Top-Left Action (Camera/Retake) */}
        {onCameraPress ? (
          <TouchableOpacity
            style={styles.floatingButtonLeft}
            onPress={onCameraPress}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Camera size={18} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        ) : (
          <View style={styles.floatingBadgeLeft}>
            <UtensilsCrossed size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        )}

        {/* Floating Top-Right Action (Close 'X') */}
        <TouchableOpacity
          style={styles.floatingButtonRight}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Bottom Overlay: Dish Title & Big Calorie Callout */}
        <View style={styles.bannerBottomOverlay}>
          <View style={styles.bannerTitleCol}>
            <Text style={styles.bannerDishTitleText} numberOfLines={2}>
              {dish_name || 'Analyzed Meal'}
            </Text>
          </View>

          <View style={styles.bannerCalorieCol}>
            <Text style={styles.bannerCalorieNumber}>{calories || 0}</Text>
            <Text style={styles.bannerCalorieLabel}>KCAL</Text>
          </View>
        </View>
      </View>

      {/* Multi-angle mini preview thumbs (if multi-angle photos taken) */}
      {image_uris && image_uris.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.multiThumbsRow}
        >
          {image_uris.map((uri, idx) => (
            <View key={idx} style={styles.miniThumbCard}>
              <Image source={{ uri }} style={styles.miniThumbImage} resizeMode="cover" />
              <View style={styles.miniThumbLabel}>
                <Text style={styles.miniThumbText}>Angle {idx + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* 2. SEGMENTED PILL TAB SWITCHER ([Macros | Micros])          */}
      {/* ============================================================ */}
      <View
        style={styles.tabSwitcherContainer}
        onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.activeIndicatorPill,
            {
              width: pillWidth,
              transform: [{ translateX }],
            },
          ]}
        />

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleSwitchTab('macros')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabButtonText, activeTab === 'macros' && styles.tabButtonTextActive]}>
            Macronutrients
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => handleSwitchTab('micros')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabButtonText, activeTab === 'micros' && styles.tabButtonTextActive]}>
            Micronutrients
          </Text>
        </TouchableOpacity>
      </View>

      {/* ============================================================ */}
      {/* 3. TAB 1: MACRONUTRIENTS CONTENT                             */}
      {/* ============================================================ */}
      {activeTab === 'macros' && (
        <View>
          {/* Estimated Macros Card (4 Pillars + 4-Segment Bar) */}
          <View style={styles.macrosContainer}>
            <Text style={styles.sectionOverline}>ESTIMATED MACROS</Text>

            {/* 4-Color Proportional Macro Distribution Track */}
            <View style={styles.macroDistributionTrack}>
              <View style={[styles.macroBarSegment, { width: `${proteinPct}%`, backgroundColor: '#E54D42' }]} />
              <View style={[styles.macroBarSegment, { width: `${fatPct}%`, backgroundColor: '#8B5A2B' }]} />
              <View style={[styles.macroBarSegment, { width: `${carbsPct}%`, backgroundColor: '#F39C12' }]} />
              {fiberPct > 0 && (
                <View style={[styles.macroBarSegment, { width: `${fiberPct}%`, backgroundColor: '#2E7D32' }]} />
              )}
            </View>

            {/* 4-Column Horizontal Macro Grid */}
            <View style={styles.macroPillColumns}>
              {/* PROTEIN */}
              <View style={styles.macroCol}>
                <Text style={[styles.macroValueText, { color: '#E54D42' }]}>{protein_g || 0}g</Text>
                <View style={[styles.macroPctBadge, { backgroundColor: '#FFECEB' }]}>
                  <Text style={[styles.macroPctText, { color: '#E54D42' }]}>{proteinPct}%</Text>
                </View>
                <Text style={styles.macroNameLabel}>PROTEIN</Text>
              </View>

              {/* FATS */}
              <View style={styles.macroCol}>
                <Text style={[styles.macroValueText, { color: '#8B5A2B' }]}>{fat_g || 0}g</Text>
                <View style={[styles.macroPctBadge, { backgroundColor: '#F5EFEA' }]}>
                  <Text style={[styles.macroPctText, { color: '#8B5A2B' }]}>{fatPct}%</Text>
                </View>
                <Text style={styles.macroNameLabel}>FATS</Text>
              </View>

              {/* CARBS */}
              <View style={styles.macroCol}>
                <Text style={[styles.macroValueText, { color: '#F39C12' }]}>{carbs_g || 0}g</Text>
                <View style={[styles.macroPctBadge, { backgroundColor: '#FEF6E9' }]}>
                  <Text style={[styles.macroPctText, { color: '#D97706' }]}>{carbsPct}%</Text>
                </View>
                <Text style={styles.macroNameLabel}>CARBS</Text>
              </View>

              {/* FIBER */}
              <View style={styles.macroCol}>
                <Text style={[styles.macroValueText, { color: '#2E7D32' }]}>{fiberGrams}g</Text>
                <View style={[styles.macroPctBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.macroPctText, { color: '#2E7D32' }]}>{fiberPct}%</Text>
                </View>
                <Text style={styles.macroNameLabel}>FIBER</Text>
              </View>
            </View>
          </View>

          {/* Detected Ingredients Section (Static, Non-Bold, Pill-Free) */}
          {displayItems && displayItems.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <UtensilsCrossed size={16} color="#FF5B00" />
                  <Text style={styles.sectionTitleText}>Ingredients detected</Text>
                </View>
                {/* Clean Pill-Free Item Count Text */}
                <Text style={styles.cleanCountText}>{displayItems.length} items</Text>
              </View>

              <View style={styles.ingredientsList}>
                {displayItems.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ingredientRow,
                      idx === displayItems.length - 1 && styles.ingredientRowLast,
                    ]}
                  >
                    <View style={styles.ingredientInfoCol}>
                      {/* Non-Bold Regular Weight Ingredient Name */}
                      <Text style={styles.ingredientNameText}>{item.name}</Text>
                      <Text style={styles.ingredientSubText}>
                        {formatIngredientPortion(item)}
                      </Text>
                    </View>

                    {/* Clean Pill-Free Right-Aligned Calories */}
                    <View style={styles.ingredientCalContainer}>
                      <Text style={styles.ingredientCalNumber}>
                        {item.calories} <Text style={styles.ingredientCalUnit}>kcal</Text>
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* ============================================================ */}
      {/* 4. TAB 2: MICRONUTRIENTS CONTENT                             */}
      {/* ============================================================ */}
      {activeTab === 'micros' && (
        <View>
          {/* Estimated Micronutrients Section */}
          {microList.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Leaf size={16} color="#2E7D32" />
                  <Text style={styles.sectionTitleText}>Estimated Micronutrients</Text>
                </View>
              </View>

              <View style={styles.microsGrid}>
                {microList.map((m, idx) => (
                  <View key={idx} style={styles.microChip}>
                    <Text style={styles.microChipValue}>{m.value}</Text>
                    <Text style={styles.microChipLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Health Insight Card */}
          {health_insight ? (
            <View style={styles.insightCard}>
              <View style={styles.insightIconBox}>
                <Sparkles size={16} color="#FF5B00" />
              </View>
              <Text style={styles.insightText}>{health_insight}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* ============================================================ */}
      {/* 5. ACTION CONTROLS SLOT (SCAN ACTIONS / LOGGED ACTIONS)     */}
      {/* ============================================================ */}
      {children ? <View style={styles.actionsWrapper}>{children}</View> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // 1. Photo Banner with Integrated Overlay
  imageBannerWrapper: {
    width: '100%',
    height: 260,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2A1810',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F5',
    gap: 8,
  },
  placeholderText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
    color: '#8C7B73',
  },
  scrimContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  floatingButtonLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(42, 24, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
  },
  floatingBadgeLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(42, 24, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
  },
  floatingButtonRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(42, 24, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 10,
  },
  bannerBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bannerTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  bannerDishTitleText: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 16.5,
    lineHeight: 22,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerCalorieCol: {
    alignItems: 'flex-end',
  },
  bannerCalorieNumber: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#FF6B00',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerCalorieLabel: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#FFEAD9',
  },
  multiThumbsRow: {
    gap: 8,
    marginBottom: 12,
  },
  miniThumbCard: {
    width: 72,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    position: 'relative',
  },
  miniThumbImage: {
    width: '100%',
    height: '100%',
  },
  miniThumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(42, 24, 16, 0.7)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  miniThumbText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontWeight: '600',
    fontSize: 8.5,
    color: '#FFFFFF',
  },

  // 2. Segmented Pill Tab Switcher
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5ECE5',
    borderRadius: 25,
    padding: 3.5,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  activeIndicatorPill: {
    position: 'absolute',
    top: 3.5,
    bottom: 3.5,
    left: 3.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabButtonText: {
    fontFamily: 'Fredoka_500Medium',
    fontWeight: '500',
    fontSize: 13,
    color: '#8C7B73',
  },
  tabButtonTextActive: {
    fontFamily: 'Fredoka_600SemiBold',
    fontWeight: '600',
    color: '#FF5B00',
  },

  // 3. Macros Section
  macrosContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 12,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionOverline: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#8C7B73',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  macroDistributionTrack: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#F5ECE5',
    marginBottom: 12,
  },
  macroBarSegment: {
    height: '100%',
  },
  macroPillColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2.5,
  },
  macroValueText: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 15,
  },
  macroPctBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  macroPctText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontWeight: '600',
    fontSize: 9.5,
  },
  macroNameLabel: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#8C7B73',
  },

  // 4. Section Card (Detected Ingredients & Micronutrients)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 12,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitleText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontWeight: '600',
    fontSize: 14.5,
    color: '#2A1810',
  },
  cleanCountText: {
    fontFamily: 'Fredoka_500Medium',
    fontWeight: '500',
    fontSize: 12,
    color: '#8C7B73',
  },

  // Ingredients List (Ultra-Compact, Clean, Pill-Free, Non-Bold Names)
  ingredientsList: {
    gap: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE5',
  },
  ingredientRowLast: {
    paddingBottom: 2,
    borderBottomWidth: 0,
  },
  ingredientInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  ingredientNameText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 13.5,
    color: '#2A1810',
    marginBottom: 1.5,
  },
  ingredientSubText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 11,
    color: '#8C7B73',
  },
  ingredientCalContainer: {
    alignItems: 'flex-end',
  },
  ingredientCalNumber: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#FF5B00',
  },
  ingredientCalUnit: {
    fontFamily: 'Fredoka_500Medium',
    fontWeight: '500',
    fontSize: 10.5,
    color: '#8C7B73',
  },

  // Micronutrients Grid
  microsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  microChip: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#FAF6F0',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    alignItems: 'center',
  },
  microChipValue: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 12.5,
    color: '#2A1810',
  },
  microChipLabel: {
    fontFamily: 'Fredoka_500Medium',
    fontWeight: '500',
    fontSize: 9.5,
    color: '#8C7B73',
    marginTop: 1.5,
    textAlign: 'center',
  },

  // Health Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE0D1',
    gap: 8,
    marginBottom: 12,
  },
  insightIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFEAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontFamily: 'Fredoka_500Medium',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#2A1810',
  },

  // Action Buttons Wrapper
  actionsWrapper: {
    marginTop: 4,
    gap: 8,
  },
});
