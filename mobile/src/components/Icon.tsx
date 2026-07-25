import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '@/theme/colors';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export type IconName =
  | 'home' | 'search' | 'settings' | 'notebook' | 'tag'
  | 'plus' | 'back' | 'check' | 'pin' | 'delete' | 'edit'
  | 'close' | 'star' | 'folder' | 'sync' | 'lock' | 'more';

const iconMap: Record<IconName, string> = {
  home: '⌂',
  search: '🔍',
  settings: '⚙',
  notebook: '📓',
  tag: '🏷',
  plus: '+',
  back: '‹',
  check: '✓',
  pin: '📌',
  delete: '🗑',
  edit: '✎',
  close: '✕',
  star: '★',
  folder: '📁',
  sync: '↻',
  lock: '🔒',
  more: '⋯',
};

export function Icon({ name, size = 24, color = theme.colors.inkSoft }: IconProps) {
  return <Text style={[styles.icon, { fontSize: size, color }]}>{iconMap[name]}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});
