import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNutrition } from '../../context/NutritionContext';
import { askNutritionCoach, ChatMessage } from '../../services/aiCoachService';
import { CustomConfirmModal } from '../modals/CustomConfirmModal';
import {
  Sparkles,
  Send,
  Bot,
  UtensilsCrossed,
  CheckCircle2,
  Lightbulb,
} from '../ui/LucideIcons';

export const AiCoachTab: React.FC = () => {
  const { profile } = useAuth();
  const {
    todayCalories,
    todayProtein,
    todayCarbs,
    todayFat,
    loggedMeals,
    addMealLog,
  } = useNutrition();

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loggedMealSuccess, setLoggedMealSuccess] = useState<string | null>(null);
  const [loggedSuggestions, setLoggedSuggestions] = useState<Record<string, boolean>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const calorieTarget = profile?.daily_calorie_target || 2400;
  const proteinTarget = profile?.daily_protein_target || 120;
  const remainingCals = Math.max(0, calorieTarget - todayCalories);
  const remainingProt = Math.max(0, proteinTarget - todayProtein);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, (e) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'ai',
      text: `Hello ${profile?.full_name?.split(' ')[0] || 'there'}! I am your personal NutriScan AI Coach.\n\nToday: ${todayCalories}/${calorieTarget} kcal (${remainingCals} kcal left, ${remainingProt}g protein left). How can I help with your nutrition?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    'What should I eat for dinner?',
    'High-protein snack recipe (<200 kcal)',
    'Review my macro balance today',
    'Best post-workout recovery dish',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await askNutritionCoach(query, messages, {
        profile,
        todayCalories,
        todayProtein,
        todayCarbs,
        todayFat,
        loggedMeals,
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: response.reply,
        suggestedMeal: response.suggestedMeal,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('[AiCoachTab] Error asking coach:', err);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleAddSuggestedMeal = (msgId: string, meal: ChatMessage['suggestedMeal']) => {
    if (!meal) return;

    addMealLog({
      dish_name: meal.dish_name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      micronutrients: meal.micronutrients,
      source: 'preset',
    });

    setLoggedSuggestions((prev) => ({ ...prev, [msgId]: true }));
    setLoggedMealSuccess(meal.dish_name);
  };

  return (
    <View style={styles.container}>
      {/* 1. Clean Coach Header */}
      <View style={styles.topHeader}>
        <View style={styles.coachAvatarBadge}>
          <Sparkles size={18} color="#FF5B00" />
        </View>
        <View style={styles.coachTitleCol}>
          <Text style={styles.coachTitle}>AI Nutrition Coach</Text>
          <Text style={styles.coachStatus}>
            {remainingCals} kcal • {remainingProt}g protein left today
          </Text>
        </View>
      </View>

      {/* 2. Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={[
          styles.messagesContent,
          keyboardHeight === 0 && { paddingBottom: 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isLogged = loggedSuggestions[msg.id];

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isAi ? styles.messageRowAi : styles.messageRowUser,
              ]}
            >
              {isAi && (
                <View style={styles.msgAvatar}>
                  <Bot size={14} color="#FF5B00" />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isAi ? styles.bubbleAi : styles.bubbleUser,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isAi ? styles.textAi : styles.textUser,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Optional Structured Suggested Meal Card */}
                {isAi && msg.suggestedMeal && (
                  <View style={styles.suggestedMealCard}>
                    <View style={styles.suggestedTopRow}>
                      <View style={styles.suggestedIconBox}>
                        <UtensilsCrossed size={14} color="#FF5B00" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.suggestedLabel}>RECOMMENDED DISH</Text>
                        <Text style={styles.suggestedTitle} numberOfLines={1}>
                          {msg.suggestedMeal.dish_name}
                        </Text>
                      </View>
                      <Text style={styles.suggestedCals}>
                        {msg.suggestedMeal.calories} kcal
                      </Text>
                    </View>

                    <View style={styles.suggestedMacroRow}>
                      <Text style={[styles.suggestedMacro, { color: '#E54D42' }]}>
                        {msg.suggestedMeal.protein_g}g P
                      </Text>
                      <Text style={[styles.suggestedMacro, { color: '#F39C12' }]}>
                        {msg.suggestedMeal.carbs_g}g C
                      </Text>
                      <Text style={[styles.suggestedMacro, { color: '#8B5A2B' }]}>
                        {msg.suggestedMeal.fat_g}g F
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.addSuggestedBtn,
                        isLogged && styles.addSuggestedBtnDone,
                      ]}
                      onPress={() => handleAddSuggestedMeal(msg.id, msg.suggestedMeal)}
                      disabled={isLogged}
                      activeOpacity={0.8}
                    >
                      {isLogged ? (
                        <>
                          <CheckCircle2 size={14} color="#2E7D32" />
                          <Text style={styles.addSuggestedTextDone}>Added to Tracker</Text>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} color="#FFFFFF" />
                          <Text style={styles.addSuggestedText}>Add to Daily Tracker</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                <Text
                  style={[
                    styles.messageTimestamp,
                    isAi ? styles.timestampAi : styles.timestampUser,
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View style={styles.msgAvatar}>
              <Bot size={14} color="#FF5B00" />
            </View>
            <View style={[styles.messageBubble, styles.bubbleAi, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#FF5B00" />
              <Text style={styles.typingText}>NutriScan AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3. Quick Action Chips */}
      <View style={styles.quickPromptsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {quickPrompts.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickChip}
              onPress={() => handleSend(prompt)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Lightbulb size={12} color="#FF5B00" />
              <Text style={styles.quickChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. Chat Input Bar with Exact Keyboard Height Compensation */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + (Platform.OS === 'android' ? 36 : 12) : 98,
          },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Ask for food ideas, advice, recipes..."
          placeholderTextColor="#8C7B73"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Send size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={!!loggedMealSuccess}
        title="Meal Logged Successfully!"
        message={`"${loggedMealSuccess}" has been added to your daily intake tracker.`}
        confirmText="Awesome"
        cancelText="Close"
        confirmStyle="primary"
        icon={<CheckCircle2 size={26} color="#FF5B00" />}
        onConfirm={() => setLoggedMealSuccess(null)}
        onCancel={() => setLoggedMealSuccess(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EFE7DF',
  },
  coachAvatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  coachTitleCol: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  coachStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C7B73',
    marginTop: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  messageRowAi: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  bubbleUser: {
    backgroundColor: '#FF5B00',
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  textAi: {
    color: '#2A1810',
    fontWeight: '500',
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTimestamp: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'right',
  },
  timestampAi: {
    color: '#8C7B73',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8C7B73',
  },
  suggestedMealCard: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 10,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  suggestedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestedIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FF5B00',
    letterSpacing: 0.5,
  },
  suggestedTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 1,
  },
  suggestedCals: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  suggestedMacroRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EFE7DF',
  },
  suggestedMacro: {
    fontSize: 10,
    fontWeight: '700',
  },
  addSuggestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 6,
  },
  addSuggestedBtnDone: {
    backgroundColor: '#E8F5E9',
  },
  addSuggestedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addSuggestedTextDone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  quickPromptsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFE7DF',
    paddingVertical: 6,
  },
  quickPromptsScroll: {
    paddingHorizontal: 14,
    gap: 6,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    gap: 5,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5B00',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#EFE7DF',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#2A1810',
    maxHeight: 80,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF5B00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1C7BD',
  },
});
