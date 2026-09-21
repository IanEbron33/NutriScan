import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { X } from './LucideIcons';

interface TargetHitToastProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
}

export const TargetHitToast: React.FC<TargetHitToastProps> = ({
  visible,
  title,
  message,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      // Slide down and fade in with spring
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3.2s
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, 3200);
    } else {
      slideAnim.setValue(-120);
      opacityAnim.setValue(0);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible, title, message]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastCard}
        onPress={handleDismiss}
        activeOpacity={0.92}
      >
        {/* Short Text Content */}
        <View style={styles.textCol}>
          <Text style={styles.titleText}>{title}</Text>
          {message ? (
            <Text style={styles.messageText} numberOfLines={1}>
              {message}
            </Text>
          ) : null}
        </View>

        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={15} color="#8C7B73" strokeWidth={2.4} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 42,
    left: 20,
    right: 20,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  textCol: {
    flex: 1,
    paddingRight: 10,
  },
  titleText: {
    fontFamily: 'Fredoka_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#2A1810',
  },
  messageText: {
    fontFamily: 'Fredoka_400Regular',
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
