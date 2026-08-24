import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const BrandLogoIcon: React.FC<{ size?: number }> = ({ size = 48 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx="24" fill="#FFF0E6" />
      {/* Outer focus bracket */}
      <Path
        d="M14 19V15C14 13.8954 14.8954 13 16 13H20"
        stroke="#FF5B00"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M34 19V15C34 13.8954 33.1046 13 32 13H28"
        stroke="#FF5B00"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M14 29V33C14 34.1046 14.8954 35 16 35H20"
        stroke="#FF5B00"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M34 29V33C34 34.1046 33.1046 35 32 35H28"
        stroke="#FF5B00"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center Food/Leaf element */}
      <Path
        d="M24 18C19 18 18 23 18 26C18 29.3137 20.6863 32 24 32C27.3137 32 30 29.3137 30 26C30 23 29 18 24 18Z"
        fill="#FF5B00"
      />
      <Path
        d="M24 21V28"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const CameraScanIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#FF5B00',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V6C4 4.89543 4.89543 4 6 4H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M20 8V6C20 4.89543 19.1046 4 18 4H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M4 16V18C4 19.1046 4.89543 20 6 20H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M20 16V18C20 19.1046 19.1046 20 18 20H16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

export const MacroPieIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#F39C12',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3255 21.9333 10.6667 21.8062 10.0298"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M12 2V12H22C22 6.47715 17.5228 2 12 2Z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const TargetGoalIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#2E7D32',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
};

export const FlameStreakIcon: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C9.5 7 6 9.5 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 10 15 6 12 2Z"
        fill="#FF5B00"
      />
      <Path
        d="M12 11C10.5 13 9 14.5 9 16C9 17.6569 10.3431 19 12 19C13.6569 19 15 17.6569 15 16C15 14 13.5 12 12 11Z"
        fill="#FBBC05"
      />
    </Svg>
  );
};

export const TrendUpIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#2E7D32',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6L13.5 15.5L8.5 10.5L1 18"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6H23V12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

