import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';

interface AuthInputProps extends TextInputProps {
  label: string;
  iconName?: 'mail' | 'lock';
  rightActionText?: string;
  onRightActionPress?: () => void;
  isPassword?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  iconName,
  rightActionText,
  onRightActionPress,
  isPassword = false,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {rightActionText && onRightActionPress && (
          <TouchableOpacity onPress={onRightActionPress} activeOpacity={0.7}>
            <Text style={styles.rightActionText}>{rightActionText}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {/* Leading Icon */}
        <View style={styles.iconContainer}>
          {iconName === 'mail' ? (
            <Text style={styles.iconEmoji}>✉️</Text>
          ) : iconName === 'lock' ? (
            <Text style={styles.iconEmoji}>🔒</Text>
          ) : null}
        </View>

        <TextInput
          style={styles.textInput}
          placeholderTextColor="#B8ABA5"
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...inputProps}
        />

        {/* Eye toggle for password */}
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1810',
  },
  rightActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A05530',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#EFE7E1',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#FF5B00',
    shadowOpacity: 0.08,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#2A1810',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
});
