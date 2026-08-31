import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | `${number}%`;
  showHandle?: boolean;
  closeThreshold?: number;
  sheetStyle?: ViewStyle;
  backgroundColor?: string;
  keyboardAvoid?: boolean;
}

export const DraggableBottomSheet: React.FC<DraggableBottomSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = '90%',
  showHandle = true,
  closeThreshold = 100,
  sheetStyle,
  backgroundColor = '#FAF6F0',
  keyboardAvoid = false,
}) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Open & close animation lifecycle
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          mass: 0.9,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      animateDismiss();
    }
  }, [visible]);

  const animateDismiss = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  // Pan Responder for drag handle and top header
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 4 || (gestureState.dy < -2 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx));
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Dragging down: 1:1 direct tracking
          translateY.setValue(gestureState.dy);
        } else {
          // Dragging up: rubber band resistance
          translateY.setValue(gestureState.dy * 0.2);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        // If dragged down past threshold OR swiped down with fast velocity
        if (gestureState.dy > closeThreshold || gestureState.vy > 0.6) {
          animateDismiss();
        } else {
          // Spring back up to open position
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            mass: 0.8,
            stiffness: 250,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!modalVisible) return null;

  const content = (
    <View style={styles.overlay}>
      {/* 1. Backdrop Touch to Dismiss */}
      <TouchableWithoutFeedback onPress={animateDismiss}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.55],
              }),
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* 2. Animated Sheet Container */}
      <Animated.View
        style={[
          styles.sheetContainer,
          { backgroundColor, maxHeight },
          sheetStyle,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Top Interactive Drag Handle Bar (Single Source of Truth) */}
        {showHandle && (
          <View style={styles.handleTouchableArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandleBar} />
          </View>
        )}

        {/* Sheet Content */}
        {children}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={animateDismiss}
      statusBarTranslucent
    >
      {keyboardAvoid ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C130D',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#EFE7DF',
    overflow: 'hidden',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  handleTouchableArea: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dragHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1C7BD',
  },
});
