import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  SafeAreaView,
} from 'react-native';
import { theme } from '@/theme/colors';
import { useNoteStore } from '@/store/useNoteStore';
import { NoteCard } from '@/components/NoteCard';
import type { Note } from '@/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const FILTERS = ['全部', '置顶', '工作', '学习', '生活', '灵感'];

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { notes, isLoading, loadNotes, createNote, selectedNotebookId } = useNoteStore();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotes(selectedNotebookId);
    }, [selectedNotebookId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes(selectedNotebookId);
    setRefreshing(false);
  };

  const handleNewNote = async () => {
    const note = await createNote({ notebookId: selectedNotebookId });
    navigation.navigate('Editor', { noteId: note.id });
  };

  const handleOpenNote = (note: Note) => {
    navigation.navigate('Editor', { noteId: note.id });
  };

  const displayedNotes = activeFilter === '置顶'
    ? notes.filter((n) => n.isPinned)
    : notes;

  return (
    <SafeAreaView style={styles.container}>
      {/* 页头 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            我的<Text style={styles.titleAccent}>笔记</Text>
          </Text>
          <Text style={styles.subtitle}>共 {notes.length} 条</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Text style={styles.iconBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* 搜索栏 */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('TagsTab')}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>搜索笔记、标签...</Text>
      </TouchableOpacity>

      {/* 筛选标签 */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 笔记列表 */}
      <FlatList
        data={displayedNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NoteCard note={item} onPress={handleOpenNote} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>还没有笔记</Text>
            <Text style={styles.emptyDesc}>点击右下角 + 创建第一条笔记</Text>
          </View>
        }
      />

      {/* 悬浮新建按钮 */}
      <TouchableOpacity style={styles.fab} onPress={handleNewNote}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    fontSize: 18,
    color: theme.colors.inkSoft,
  },
  searchBar: {
    marginHorizontal: 24,
    marginBottom: 16,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: theme.colors.inkFaint,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.inkMuted,
  },
  chipTextActive: {
    color: theme.colors.paper,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.colors.inkFaint,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: theme.colors.paper,
    fontWeight: '300',
    marginTop: -2,
  },
});
