import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/theme/colors';
import type { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const timeStr = formatTime(note.updatedAt);

  return (
    <TouchableOpacity
      style={[styles.card, note.isPinned && styles.pinned]}
      onPress={() => onPress(note)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {note.title || '无标题'}
        </Text>
        {note.isPinned && (
          <Text style={styles.pinIcon}>📌</Text>
        )}
      </View>

      {note.excerpt ? (
        <Text style={styles.excerpt} numberOfLines={2}>
          {note.excerpt}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <Text style={styles.metaText}>{timeStr}</Text>
        {note.syncStatus === 'pending' && (
          <Text style={styles.syncBadge}>待同步</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < day) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < day * 7) return `${Math.floor(diff / day)} 天前`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
  },
  pinned: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.honey,
    paddingLeft: 17,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.ink,
    flex: 1,
    lineHeight: 24,
  },
  pinIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  excerpt: {
    fontSize: 14,
    color: theme.colors.inkMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.inkFaint,
  },
  syncBadge: {
    fontSize: 11,
    color: theme.colors.honey,
    backgroundColor: theme.colors.honeySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
