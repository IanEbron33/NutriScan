import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { FoodAnalysisResult } from '../../services/aiFoodScanner';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  Plus,
  Eye,
  Zap,
  Sparkles,
  UtensilsCrossed,
  CheckCircle2,
  X,
} from '../ui/LucideIcons';

const { width } = Dimensions.get('window');

// Donut Chart Math & Constants
const DONUT_SIZE = 106;
const DONUT_RADIUS = 42;
const DONUT_STROKE = 11;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS; // ~263.89

interface NutritionResultModalProps {
  visible: boolean;
  result: FoodAnalysisResult | null;
  onAddToDailyTracker: () => void;
  onDismiss: () => void;
}

export const NutritionResultModal: React.FC<NutritionResultModalProps> = ({
  visible,
  result,
  onAddToDailyTracker,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'macros' | 'micros'>('macros');
  const tabAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  if (!result) return null;

  const handleSwitchTab = (tab: 'macros' | 'micros') => {
    if (tab === activeTab) return;

    setActiveTab(tab);

    // Smooth spring slide animation for active pill indicator
    Animated.spring(tabAnim, {
      toValue: tab === 'macros' ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();

    // Subtle cross-fade for tab content
    Animated.sequence([
      Animated.timing(contentFadeAnim, {
        toValue: 0.4,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const totalGrams = (result.protein_g || 0) + (result.carbs_g || 0) + (result.fat_g || 0);
  const proteinPct = totalGrams > 0 ? Math.round(((result.protein_g || 0) / totalGrams) * 100) : 0;
  const carbsPct = totalGrams > 0 ? Math.round(((result.carbs_g || 0) / totalGrams) * 100) : 0;
  const fatPct = totalGrams > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  // Exact arc lengths in circumference units
  const pLen = totalGrams > 0 ? ((result.protein_g || 0) / totalGrams) * CIRCUMFERENCE : 0;
  const cLen = totalGrams > 0 ? ((result.carbs_g || 0) / totalGrams) * CIRCUMFERENCE : 0;
  const fLen = totalGrams > 0 ? ((result.fat_g || 0) / totalGrams) * CIRCUMFERENCE : 0;

  // Arc offsets (rotated by -90deg so 0 is at top 12 o'clock)
  const pOffset = 0;
  const cOffset = -pLen;
  const fOffset = -(pLen + cLen);

  return (
    <DraggableBottomSheet
      visible={visible}
      onClose={onDismiss}
      maxHeight="92%"
      showHandle={true}
    >
      {/* Clean Header Action Row */}
      <View style={styles.sheetHeaderActionRow}>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton} activeOpacity={0.7}>
          <X size={18} color="#8C7B73" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Dish Image(s) & Name */}
            {result.image_uris && result.image_uris.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.multiImagesScroll}
              >
                {result.image_uris.map((uri, idx) => (
                  <View key={idx} style={styles.multiImageCard}>
                    <Image source={{ uri }} style={styles.multiThumb} resizeMode="cover" />
                    <View style={styles.multiImageTag}>
                      <Text style={styles.multiImageTagText}>
                        {idx === 0 ? 'Main Plate' : idx === 1 ? 'Depth Angle' : 'Drink / Side'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : result.image_uri ? (
              <Image source={{ uri: result.image_uri }} style={styles.dishImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <UtensilsCrossed size={36} color="#FF5B00" />
              </View>
            )}

            <Text style={styles.dishTitle}>{result.dish_name}</Text>

            {/* Calorie Headline Banner */}
            <View style={styles.calorieBanner}>
              <Text style={styles.calorieLabel}>ESTIMATED ENERGY</Text>
              <View style={styles.calorieRow}>
                <Text style={styles.calorieNumber}>{result.calories.toLocaleString()}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
            </View>

            {/* Segmented Pill Switcher with Smooth Sliding Indicator */}
            <View style={styles.tabSwitcherContainer}>
              <Animated.View
                style={[
                  styles.activeIndicatorPill,
                  {
                    left: tabAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '50%'],
                    }),
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

            {/* TAB CONTENT (Animated Cross-Fade) */}
            <Animated.View style={{ opacity: contentFadeAnim }}>
              {/* TAB 1: MACRONUTRIENTS CONTENT */}
              {activeTab === 'macros' && (
                <View>
                  {/* 3 Macro Cards */}
                  <Text style={styles.sectionHeader}>TOTAL MACRONUTRIENTS</Text>
                  <View style={styles.macroRow}>
                    {/* Protein */}
                    <View style={[styles.macroCard, { borderColor: '#FCDAD7', backgroundColor: '#FFFDFD' }]}>
                      <View style={[styles.macroDot, { backgroundColor: '#E54D42' }]} />
                      <Text style={styles.macroGram}>{result.protein_g}g</Text>
                      <Text style={styles.macroName}>Protein</Text>
                    </View>

                    {/* Carbs */}
                    <View style={[styles.macroCard, { borderColor: '#FDEFD7', backgroundColor: '#FFFDFB' }]}>
                      <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                      <Text style={styles.macroGram}>{result.carbs_g}g</Text>
                      <Text style={styles.macroName}>Carbs</Text>
                    </View>

                    {/* Fats */}
                    <View style={[styles.macroCard, { borderColor: '#EFE7DF', backgroundColor: '#FAF8F5' }]}>
                      <View style={[styles.macroDot, { backgroundColor: '#8B5A2B' }]} />
                      <Text style={styles.macroGram}>{result.fat_g}g</Text>
                      <Text style={styles.macroName}>Fats</Text>
                    </View>
                  </View>

                  {/* Circular SVG Donut Diagram for Macro Distribution */}
                  {totalGrams > 0 && (
                    <View style={styles.circularRatioCard}>
                      <Text style={styles.sectionHeader}>MACRO RATIO DISTRIBUTION</Text>

                      <View style={styles.donutRow}>
                        {/* SVG Donut Chart */}
                        <View style={styles.donutContainer}>
                          <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}>
                            <G rotation="-90" origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}>
                              {/* Background Track Circle */}
                              <Circle
                                cx={DONUT_SIZE / 2}
                                cy={DONUT_SIZE / 2}
                                r={DONUT_RADIUS}
                                stroke="#F5ECE5"
                                strokeWidth={DONUT_STROKE}
                                fill="none"
                              />
                              {/* Protein Arc */}
                              {pLen > 0 && (
                                <Circle
                                  cx={DONUT_SIZE / 2}
                                  cy={DONUT_SIZE / 2}
                                  r={DONUT_RADIUS}
                                  stroke="#E54D42"
                                  strokeWidth={DONUT_STROKE}
                                  strokeDasharray={`${pLen} ${CIRCUMFERENCE}`}
                                  strokeDashoffset={pOffset}
                                  fill="none"
                                />
                              )}
                              {/* Carbs Arc */}
                              {cLen > 0 && (
                                <Circle
                                  cx={DONUT_SIZE / 2}
                                  cy={DONUT_SIZE / 2}
                                  r={DONUT_RADIUS}
                                  stroke="#F39C12"
                                  strokeWidth={DONUT_STROKE}
                                  strokeDasharray={`${cLen} ${CIRCUMFERENCE}`}
                                  strokeDashoffset={cOffset}
                                  fill="none"
                                />
                              )}
                              {/* Fats Arc */}
                              {fLen > 0 && (
                                <Circle
                                  cx={DONUT_SIZE / 2}
                                  cy={DONUT_SIZE / 2}
                                  r={DONUT_RADIUS}
                                  stroke="#8B5A2B"
                                  strokeWidth={DONUT_STROKE}
                                  strokeDasharray={`${fLen} ${CIRCUMFERENCE}`}
                                  strokeDashoffset={fOffset}
                                  fill="none"
                                />
                              )}
                            </G>
                          </Svg>

                          {/* Center Total Weight inside Donut Hole */}
                          <View style={styles.donutCenterLabel}>
                            <Text style={styles.donutCenterNumber}>{totalGrams}g</Text>
                            <Text style={styles.donutCenterSubtitle}>Total</Text>
                          </View>
                        </View>

                        {/* Right Side Vertical Macro Legend Stack */}
                        <View style={styles.legendContainer}>
                          {/* Protein Item */}
                          <View style={styles.legendRow}>
                            <View style={styles.legendTitleSide}>
                              <View style={[styles.legendDot, { backgroundColor: '#E54D42' }]} />
                              <Text style={styles.legendLabel}>Protein</Text>
                            </View>
                            <View style={[styles.legendBadge, { backgroundColor: '#FDEEEB' }]}>
                              <Text style={[styles.legendBadgeText, { color: '#E54D42' }]}>
                                {result.protein_g}g ({proteinPct}%)
                              </Text>
                            </View>
                          </View>

                          {/* Carbs Item */}
                          <View style={styles.legendRow}>
                            <View style={styles.legendTitleSide}>
                              <View style={[styles.legendDot, { backgroundColor: '#F39C12' }]} />
                              <Text style={styles.legendLabel}>Carbs</Text>
                            </View>
                            <View style={[styles.legendBadge, { backgroundColor: '#FEF6E9' }]}>
                              <Text style={[styles.legendBadgeText, { color: '#D97706' }]}>
                                {result.carbs_g}g ({carbsPct}%)
                              </Text>
                            </View>
                          </View>

                          {/* Fats Item */}
                          <View style={styles.legendRow}>
                            <View style={styles.legendTitleSide}>
                              <View style={[styles.legendDot, { backgroundColor: '#8B5A2B' }]} />
                              <Text style={styles.legendLabel}>Fats</Text>
                            </View>
                            <View style={[styles.legendBadge, { backgroundColor: '#F4ECE4' }]}>
                              <Text style={[styles.legendBadgeText, { color: '#8B5A2B' }]}>
                                {result.fat_g}g ({fatPct}%)
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Detected Items on Plate / Table */}
                  {result.detected_items && result.detected_items.length > 0 && (
                    <View style={styles.detectedItemsSection}>
                      <Text style={[styles.sectionHeader, { marginTop: 4 }]}>
                        DETECTED MEAL ITEMS ({result.detected_items.length})
                      </Text>
                      <View style={styles.itemsList}>
                        {result.detected_items.map((item, idx) => (
                          <View key={idx} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                              <View style={styles.itemIconContainer}>
                                <UtensilsCrossed size={14} color="#FF5B00" />
                              </View>
                              <View style={styles.itemTitleBlock}>
                                <Text style={styles.itemTitle}>{item.name}</Text>
                                {item.portion ? (
                                  <View style={styles.portionBadge}>
                                    <Text style={styles.portionText}>{item.portion}</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>

                            <View style={styles.itemMacrosRow}>
                              <View style={styles.miniMacroPill}>
                                <Text style={styles.miniMacroCal}>{item.calories} kcal</Text>
                              </View>
                              <View style={styles.miniMacroPill}>
                                <View style={[styles.miniDot, { backgroundColor: '#E54D42' }]} />
                                <Text style={styles.miniMacroText}>{item.protein_g}g P</Text>
                              </View>
                              <View style={styles.miniMacroPill}>
                                <View style={[styles.miniDot, { backgroundColor: '#F39C12' }]} />
                                <Text style={styles.miniMacroText}>{item.carbs_g}g C</Text>
                              </View>
                              <View style={styles.miniMacroPill}>
                                <View style={[styles.miniDot, { backgroundColor: '#8B5A2B' }]} />
                                <Text style={styles.miniMacroText}>{item.fat_g}g F</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* TAB 2: MICRONUTRIENTS CONTENT */}
              {activeTab === 'micros' && (
                <View>
                  {/* Comprehensive Estimated Micronutrients Grid */}
                  {result.micronutrients && (
                    <View style={styles.microSection}>
                      <Text style={styles.sectionHeader}>ESTIMATED MICRONUTRIENTS</Text>
                      <View style={styles.microGrid}>
                        {result.micronutrients.potassium_mg !== undefined && result.micronutrients.potassium_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Potassium</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.potassium_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.fiber_g !== undefined && result.micronutrients.fiber_g > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Fiber</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.fiber_g} <Text style={styles.microCardUnit}>g</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.vitamin_c_mg !== undefined && result.micronutrients.vitamin_c_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Vitamin C</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.vitamin_c_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.vitamin_b6_mg !== undefined && result.micronutrients.vitamin_b6_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Vitamin B6</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.vitamin_b6_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.magnesium_mg !== undefined && result.micronutrients.magnesium_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Magnesium</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.magnesium_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.iron_mg !== undefined && result.micronutrients.iron_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Iron</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.iron_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}

                        {result.micronutrients.calcium_mg !== undefined && result.micronutrients.calcium_mg > 0 && (
                          <View style={styles.microCard}>
                            <Text style={styles.microCardLabel}>Calcium</Text>
                            <Text style={styles.microCardValue}>
                              {result.micronutrients.calcium_mg} <Text style={styles.microCardUnit}>mg</Text>
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Health Insight */}
                  {result.health_insight ? (
                    <View style={styles.insightBox}>
                      <Sparkles size={16} color="#FF5B00" style={{ marginTop: 2 }} />
                      <Text style={styles.insightText}>{result.health_insight}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Action Buttons: Log vs Inspect Only */}
          <View style={styles.buttonContainer}>
            {/* Primary: Add to Daily Tracker */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onAddToDailyTracker}
              activeOpacity={0.85}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.primaryButtonText}>Add to Daily Tracker</Text>
            </TouchableOpacity>

            {/* Secondary: Just Checking / Dismiss without logging */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Eye size={18} color="#8B4513" strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>Just Checking (Dismiss)</Text>
            </TouchableOpacity>
          </View>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetHeaderActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  scrollContent: {
    paddingBottom: 12,
  },
  multiImagesScroll: {
    gap: 10,
    marginBottom: 14,
  },
  multiImageCard: {
    width: 140,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  multiThumb: {
    width: '100%',
    height: '100%',
  },
  multiImageTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiImageTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2A1810',
  },
  dishImage: {
    width: '100%',
    height: 175,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  imagePlaceholder: {
    width: '100%',
    height: 130,
    borderRadius: 20,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#FFDBC2',
  },
  dishTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A1810',
    marginBottom: 12,
  },
  calorieBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
  },
  calorieLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  calorieNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B4513',
  },
  calorieUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8C7B73',
  },

  // Segmented Tab Switcher with Sliding Indicator
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE7DF',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
    position: 'relative',
    height: 44,
  },
  activeIndicatorPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: '#FF5B00',
    borderRadius: 21,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    zIndex: 1,
  },
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7D6E66',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  macroCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  macroGram: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1810',
  },
  macroName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#8C7B73',
    marginTop: 2,
  },

  // Circular Macro Ratio Card & Donut Chart
  circularRatioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 4,
  },
  donutContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1810',
  },
  donutCenterSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C7B73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendContainer: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF6F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  legendTitleSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  legendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  legendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  microSection: {
    marginBottom: 14,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  microCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    gap: 4,
  },
  microCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7B73',
  },
  microCardValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#2A1810',
  },
  microCardUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7B73',
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFDBC2',
    marginTop: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12.5,
    color: '#8B4513',
    lineHeight: 18,
    fontWeight: '600',
  },

  // Detected Items Breakdown
  detectedItemsSection: {
    marginBottom: 14,
  },
  itemsList: {
    gap: 8,
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  itemTitleBlock: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#2A1810',
    lineHeight: 20,
  },
  portionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFDBC2',
  },
  portionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5B00',
  },
  itemMacrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  miniMacroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  miniMacroCal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B4513',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniMacroText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D6E66',
  },
  buttonContainer: {
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#FF5B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFF0E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFDBC2',
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '800',
  },
});
