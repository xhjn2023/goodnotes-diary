import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { theme } from '@/theme/colors';

// M1 阶段:简化标签页(标签功能在 M3 完善)
const SAMPLE_TAGS = [
  { id: '1', name: '工作', color: theme.colors.honey, count: 12 },
  { id: '2', name: '技术', color: theme.colors.sage, count: 10 },
  { id: '3', name: '生活', color: theme.colors.rose, count: 8 },
  { id: '4', name: '阅读', color: '#7C3AED', count: 5 },
  { id: '5', name: '学习', color: '#0891B2', count: 5 },
  { id: '6', name: '旅行', color: '#DC2626', count: 3 },
  { id: '7', name: '灵感', color: theme.colors.inkMuted, count: 3 },
  { id: '8', name: '日记', color: theme.colors.inkFaint, count: 2 },
];

export function TagsScreen() {
  const renderItem = ({ item }: { item: typeof SAMPLE_TAGS[0] }) => (
    <TouchableOpacity style={styles.tagRow}>
      <View style={styles.tagRowLeft}>
        <View style={[styles.tagDot, { backgroundColor: item.color }]} />
        <Text style={styles.tagName}>{item.name}</Text>
      </View>
      <Text style={styles.tagCount}>{item.count} 条笔记</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            标<Text style={styles.titleAccent}>签</Text>
          </Text>
          <Text style={styles.subtitle}>{SAMPLE_TAGS.length} 个标签</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 标签云 */}
      <View style={styles.tagCloudSection}>
        <Text style={styles.sectionLabel}>标签云</Text>
        <View style={styles.tagCloud}>
          {SAMPLE_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagCloudItem, { backgroundColor: tag.color + '22' }]}
            >
              <Text style={[styles.tagCloudText, { color: tag.color }]}>
                {tag.name} <Text style={styles.tagCloudCount}>{tag.count}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 标签列表 */}
      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>所有标签</Text>
        <FlatList
          data={SAMPLE_TAGS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontFamily: theme.fonts.serif,
    fontSize: 38,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: theme.colors.ink,
  },
  titleAccent: {
    fontStyle: 'italic',
    fontWeight: '400',
    color: theme.colors.honey,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    marginTop: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    fontSize: 22,
    color: theme.colors.inkSoft,
    marginTop: -2,
  },
  tagCloudSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: 14,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagCloudItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagCloudText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagCloudCount: {
    fontSize: 11,
    opacity: 0.6,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  list: {
    paddingBottom: 120,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.md,
    marginBottom: 8,
  },
  tagRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  tagName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.ink,
  },
  tagCount: {
    fontSize: 13,
    color: theme.colors.inkFaint,
  },
});
