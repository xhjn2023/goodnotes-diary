import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { theme } from '@/theme/colors';
import { useNoteStore } from '@/store/useNoteStore';
import { getDB } from '@/db/schema';

import { HomeScreen } from '@/screens/HomeScreen';
import { NoteEditorScreen } from '@/screens/NoteEditorScreen';
import { NotebooksScreen } from '@/screens/NotebooksScreen';
import { TagsScreen } from '@/screens/TagsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type RootStackParamList = {
  Home: undefined;
  Editor: { noteId?: string };
  Notebooks: undefined;
  Tags: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// 主 Tab 容器
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.honey,
        tabBarInactiveTintColor: theme.colors.inkFaint,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceSoft,
          borderTopColor: theme.colors.borderSoft,
          height: 88,
          paddingBottom: 34,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: '首页', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text> }}
      />
      <Tab.Screen
        name="NotebooksTab"
        component={NotebooksScreen}
        options={{ tabBarLabel: '笔记本', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📁</Text> }}
      />
      <Tab.Screen
        name="TagsTab"
        component={TagsScreen}
        options={{ tabBarLabel: '标签', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏷</Text> }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: '设置', tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚙</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadNotebooks = useNoteStore((s) => s.loadNotebooks);

  useEffect(() => {
    (async () => {
      await getDB();
      await loadNotebooks();
      await loadNotes();
    })();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Editor"
          component={NoteEditorScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
