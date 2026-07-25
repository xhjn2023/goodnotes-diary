import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, SafeAreaView, Alert,
} from 'react-native';
import { theme } from '@/theme/colors';
import { useNoteStore } from '@/store/useNoteStore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { Notebook } from '@/types';

const ICONS = ['📁', '💼', '📚', '🌿', '💡', '✈️', '📖', '🎯', '🎵', '🏠'];
const COLORS = ['#8E8E93', '#B45309', '#4D7C5F', '#BE5A48', '#7C3AED', '#0891B2'];

export function NotebooksScreen() {
  const navigation = useNavigation<any>();
  const { notebooks, loadNotebooks, createNotebook, deleteNotebook, selectNotebook } = useNoteStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState('#8E8E93');

  useFocusEffect(
    React.useCallback(() => {
      loadNotebooks();
    }, [])
  );

  const handleCreate = async () => {
    if (!newName.trim()) {
      Alert.alert('提示', '请输入笔记本名称');
      return;
    }
    await createNotebook(newName.trim(), newIcon, newColor);
    setNewName('');
    setNewIcon('📁');
    setNewColor('#8E8E93');
    setShowCreate(false);
  };

  const handleOpenNotebook = (nb: Notebook) => {
    selectNotebook(nb.id);
    navigation.navigate('Main', { screen: 'HomeTab' });
  };

  const handleDelete = (nb: Notebook) => {
    Alert.alert(
      '删除笔记本',
      `确定删除「${nb.name}」吗?内含笔记将移至未分类。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '删除', style: 'destructive', onPress: () => deleteNotebook(nb.id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notebook }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenNotebook(item)}
      onLongPress={() => handleDelete(item)}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color + '22' }]}>
        <Text style={styles.iconEmoji}>{item.icon}</Text>
      </View>
      <Text style={styles.nbName}>{item.name}</Text>
      <Text style={styles.nbCount}>{item.noteCount} 条笔记</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            笔记<Text style={styles.titleAccent}>本</Text>
          </Text>
          <Text style={styles.subtitle}>{notebooks.length} 个笔记本</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.iconBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notebooks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />

      {/* 创建笔记本弹窗 */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新建笔记本</Text>

            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="笔记本名称"
              placeholderTextColor={theme.colors.inkFaint}
              autoFocus
            />

            <Text style={styles.sectionLabel}>图标</Text>
            <View style={styles.iconRow}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, newIcon === icon && styles.iconOptionActive]}
                  onPress={() => setNewIcon(icon)}
                >
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>颜色</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: color }, newColor === color && styles.colorOptionActive]}
                  onPress={() => setNewColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleCreate}
              >
                <Text style={styles.modalBtnConfirmText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  list: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  row: {
    gap: 14,
    marginBottom: 14,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    padding: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconEmoji: {
    fontSize: 24,
  },
  nbName: {
    fontFamily: theme.fonts.serif,
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: 4,
  },
  nbCount: {
    fontSize: 12,
    color: theme.colors.inkFaint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,25,23,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: theme.fonts.serif,
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.paperDeep,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    borderColor: theme.colors.honey,
    backgroundColor: theme.colors.honeySoft,
  },
  iconOptionText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: theme.colors.ink,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: theme.colors.paperDeep,
  },
  modalBtnConfirm: {
    backgroundColor: theme.colors.ink,
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.inkSoft,
  },
  modalBtnConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.paper,
  },
});
