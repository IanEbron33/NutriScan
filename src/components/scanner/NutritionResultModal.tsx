import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { FoodAnalysisResult } from '../../services/aiFoodScanner';
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
  if (!result) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Drag / Close Bar */}
          <View style={styles.headerRow}>
            <View style={styles.latencyBadge}>
              <Zap size={14} color="#FF5B00" fill="#FF5B00" />
              <Text style={styles.latencyText}>
                {result.latency_ms}ms • {result.source === 'edge_function' ? 'Edge AI (3.5 Flash)' : result.source === 'client_direct' ? 'Gemini 3.5 Flash' : 'Preset'}
              </Text>
            </View>

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

            {/* Detected Items on Plate / Table */}
            {result.detected_items && result.detected_items.length > 0 && (
              <View style={styles.detectedItemsSection}>
                <Text style={[styles.sectionHeader, { marginTop: 8 }]}>
                  DETECTED MEAL ITEMS ({result.detected_items.length})
                </Text>
                <View style={styles.itemsList}>
                  {result.detected_items.map((item, idx) => (
                    <View key={idx} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTitleRow}>
                          <View style={styles.itemIconContainer}>
                            <UtensilsCrossed size={13} color="#FF5B00" />
                          </View>
                          <Text style={styles.itemTitle} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>
                        {item.portion ? (
                          <View style={styles.portionBadge}>
                            <Text style={styles.portionText}>{item.portion}</Text>
                          </View>
                        ) : null}
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

            {/* Micronutrients Snapshot */}
            {result.micronutrients && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: 14 }]}>MICRONUTRIENTS</Text>
                <View style={styles.microPillsRow}>
                  {result.micronutrients.vitamin_c_mg !== undefined && (
                    <View style={styles.microPill}>
                      <CheckCircle2 size={13} color="#2E7D32" />
                      <Text style={styles.microPillText}>
                        Vit C: {result.micronutrients.vitamin_c_mg}mg
                      </Text>
                    </View>
                  )}
                  {result.micronutrients.iron_mg !== undefined && (
                    <View style={styles.microPill}>
                      <CheckCircle2 size={13} color="#F39C12" />
                      <Text style={styles.microPillText}>
                        Iron: {result.micronutrients.iron_mg}mg
                      </Text>
                    </View>
                  )}
                  {result.micronutrients.calcium_mg !== undefined && (
                    <View style={styles.microPill}>
                      <CheckCircle2 size={13} color="#FF5B00" />
                      <Text style={styles.microPillText}>
                        Calcium: {result.micronutrients.calcium_mg}mg
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Health Insight */}
            {result.health_insight ? (
              <View style={styles.insightBox}>
                <Sparkles size={16} color="#FF5B00" style={{ marginTop: 2 }} />
                <Text style={styles.insightText}>{result.health_insight}</Text>
              </View>
            ) : null}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 24, 16, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF6F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFDBC2',
    gap: 6,
  },
  latencyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5B00',
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  scrollContent: {
    paddingBottom: 16,
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
    height: 180,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 20,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 16,
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
    padding: 12,
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
  microPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  microPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    gap: 6,
  },
  microPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A1810',
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFDBC2',
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
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  itemIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1810',
    flex: 1,
  },
  portionBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    paddingHorizontal: 7,
    paddingVertical: 3,
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
    marginTop: 8,
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
