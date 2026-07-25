import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { theme } from '@/theme/colors';
import { useNoteStore } from '@/store/useNoteStore';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

interface Props {
  route: { params?: { noteId?: string } };
  navigation: any;
}

export function NoteEditorScreen({ route, navigation }: Props) {
  const noteId = route.params?.noteId;
  const { currentNote, loadNote, updateNote, createNote, setCurrentNote } = useNoteStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const richEditorRef = useRef<RichEditor>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (noteId) {
      loadNote(noteId);
    } else {
      setCurrentNote(null);
    }
  }, [noteId]);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
    }
  }, [currentNote]);

  // 防抖自动保存
  const scheduleSave = useCallback(
    (newTitle: string, newContent: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (noteId) {
          updateNote(noteId, { title: newTitle, content: newContent });
        }
      }, 1000);
    },
    [noteId, updateNote]
  );

  const handleTitleChange = (text: string) => {
    setTitle(text);
    scheduleSave(text, content);
  };

  const handleContentChange = (html: string) => {
    setContent(html);
    scheduleSave(title, html);
  };

  const handleBack = () => {
    // 退出前强制保存
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (noteId) {
      updateNote(noteId, { title, content });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 编辑器头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 笔记</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <Text style={styles.syncStatus}>
            {currentNote?.syncStatus === 'synced' ? '✓ 已同步' : '○ 待同步'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent}>
          {/* 标题输入 */}
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="标题"
            placeholderTextColor={theme.colors.inkFaint}
            multiline={false}
          />

          {/* 元信息 */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {currentNote ? new Date(currentNote.updatedAt).toLocaleString('zh-CN') : '新建笔记'}
            </Text>
            <Text style={styles.autoSaveHint}>· 自动保存</Text>
          </View>

          {/* 富文本编辑器 */}
          <RichEditor
            ref={richEditorRef}
            initialContentHTML={content}
            onChange={handleContentChange}
            placeholder="开始记笔记..."
            editorStyle={{
              backgroundColor: 'transparent',
              color: theme.colors.inkSoft,
              fontSize: 16,
              lineHeight: 28,
              fontFamily: theme.fonts.sans,
              placeholderColor: theme.colors.inkFaint,
              cssText: `
                body { font-family: 'DM Sans', sans-serif; color: #44403C; line-height: 1.75; padding: 0; }
                h2 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 600; color: #1C1917; margin: 20px 0 10px; }
                h3 { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 600; color: #1C1917; margin: 16px 0 8px; }
                blockquote { border-left: 3px solid #B45309; padding: 8px 16px; margin: 14px 0; background: #FEF3C7; border-radius: 0 8px 8px 0; font-style: italic; }
                code { font-family: 'JetBrains Mono', monospace; background: #EDE7DB; padding: 2px 6px; border-radius: 4px; color: #BE5A48; }
                ul, ol { margin: 0 0 14px 20px; }
              `,
            }}
            useContainer={false}
            style={styles.editor}
          />
        </ScrollView>

        {/* 工具栏 */}
        <RichToolbar
          editor={richEditorRef}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.setStrikethrough,
            actions.heading1,
            actions.heading2,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
            actions.checkboxList,
            actions.blockquote,
            actions.code,
          ]}
          iconTint={theme.colors.paper}
          selectedIconTint={theme.colors.honeyGlow}
          disabledIconTint={theme.colors.inkFaint}
          style={styles.toolbar}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.honey,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncStatus: {
    fontSize: 13,
    color: theme.colors.inkFaint,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleInput: {
    fontFamily: theme.fonts.serif,
    fontSize: 28,
    fontWeight: '600',
    color: theme.colors.ink,
    letterSpacing: -0.5,
    padding: 0,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.inkFaint,
  },
  autoSaveHint: {
    fontSize: 12,
    color: theme.colors.inkFaint,
  },
  editor: {
    flex: 1,
    minHeight: 300,
  },
  toolbar: {
    backgroundColor: theme.colors.ink,
    paddingBottom: 34,
    paddingTop: 12,
  },
});
