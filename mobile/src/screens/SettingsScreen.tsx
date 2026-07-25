import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch,
} from 'react-native';
import { theme } from '@/theme/colors';

export function SettingsScreen() {
  const [cloudSync, setCloudSync] = React.useState(true);
  const [appLock, setAppLock] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          设<Text style={styles.titleAccent}>置</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 用户卡片 */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>L</Text>
            </View>
            <View>
              <Text style={styles.userName}>林墨</Text>
              <Text style={styles.userEmail}>linmo@example.com</Text>
            </View>
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>42</Text>
              <Text style={styles.statLabel}>笔记</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>6</Text>
              <Text style={styles.statLabel}>笔记本</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>标签</Text>
            </View>
          </View>
        </View>

        {/* 同步与安全 */}
        <Text style={styles.groupLabel}>同步与安全</Text>
        <View style={styles.group}>
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.honeySoft }]}>
                <Text style={styles.itemIconEmoji}>☁️</Text>
              </View>
              <Text style={styles.itemLabel}>云端同步</Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={setCloudSync}
              trackColor={{ false: theme.colors.border, true: theme.colors.sage }}
            />
          </View>

          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.sageSoft }]}>
                <Text style={styles.itemIconEmoji}>🔒</Text>
              </View>
              <Text style={styles.itemLabel}>应用锁屏</Text>
            </View>
            <Switch
              value={appLock}
              onValueChange={setAppLock}
              trackColor={{ false: theme.colors.border, true: theme.colors.sage }}
            />
          </View>
        </View>

        {/* 外观 */}
        <Text style={styles.groupLabel}>外观</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.paperDeep }]}>
                <Text style={styles.itemIconEmoji}>☀️</Text>
              </View>
              <Text style={styles.itemLabel}>主题</Text>
            </View>
            <Text style={styles.itemValue}>浅色 ›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.paperDeep }]}>
                <Text style={styles.itemIconEmoji}>Aa</Text>
              </View>
              <Text style={styles.itemLabel}>字体大小</Text>
            </View>
            <Text style={styles.itemValue}>标准 ›</Text>
          </TouchableOpacity>
        </View>

        {/* 关于 */}
        <Text style={styles.groupLabel}>关于</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.paperDeep }]}>
                <Text style={styles.itemIconEmoji}>ℹ️</Text>
              </View>
              <Text style={styles.itemLabel}>版本</Text>
            </View>
            <Text style={styles.itemValue}>v1.0.0</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item}>
            <View style={styles.itemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: theme.colors.paperDeep }]}>
                <Text style={styles.itemIconEmoji}>📜</Text>
              </View>
              <Text style={styles.itemLabel}>隐私政策</Text>
            </View>
            <Text style={styles.itemValue}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>GoodNotes v1.0.0 · Build 2026.07.14</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.paper,
  },
  header: {
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  userCard: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.honey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontFamily: theme.fonts.serif,
    fontSize: 19,
    fontWeight: '600',
    color: theme.colors.paper,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.paper,
    opacity: 0.6,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {},
  statNum: {
    fontFamily: theme.fonts.serif,
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.paper,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.paper,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 8,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSoft,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconEmoji: {
    fontSize: 16,
  },
  itemLabel: {
    fontSize: 15,
    color: theme.colors.ink,
    fontWeight: '500',
  },
  itemValue: {
    fontSize: 14,
    color: theme.colors.inkFaint,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.inkFaint,
    paddingVertical: 20,
  },
});
