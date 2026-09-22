import React from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';
import HomeScreen from '@/screens/HomeScreen';
import SurahListScreen from '@/screens/SurahListScreen';
import AyahReaderScreen from '@/screens/AyahReaderScreen';
import MemorizationModeScreen from '@/screens/MemorizationModeScreen';
import RevisionScreen from '@/screens/RevisionScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import DeveloperScreen from '@/screens/DeveloperScreen';
import IslamicHubScreen from '@/screens/IslamicHubScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  AyahReader: { surahId: number; startAyah?: number };
  MemorizationMode: { surahId: number; startAyah?: number };
  Developer: undefined;
  IslamicHub: { initialModule?: string } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Surahs: undefined;
  IslamicHub: { initialModule?: string } | undefined;
  Revision: undefined;
  Progress: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const tabHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, focused }) => {
          const iconMap: Record<keyof MainTabParamList, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Home: { active: 'home', inactive: 'home-outline' },
            Surahs: { active: 'book', inactive: 'book-outline' },
            IslamicHub: { active: 'sparkles', inactive: 'sparkles-outline' },
            Revision: { active: 'repeat', inactive: 'repeat-outline' },
            Progress: { active: 'bar-chart', inactive: 'bar-chart-outline' },
            Settings: { active: 'settings', inactive: 'settings-outline' },
          };

          const icon = focused ? iconMap[route.name].active : iconMap[route.name].inactive;
          return <Ionicons name={icon} size={21} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Surahs" component={SurahListScreen} options={{ tabBarLabel: 'Qur\'an' }} />
      <Tab.Screen name="IslamicHub" component={IslamicHubScreen} options={{ tabBarLabel: 'Learn & Worship' }} />
      <Tab.Screen name="Revision" component={RevisionScreen} options={{ tabBarLabel: 'Revision' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        ...NavigationDefaultTheme,
        colors: {
          ...NavigationDefaultTheme.colors,
          background: colors.background,
          card: colors.surface,
          primary: colors.primary,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="AyahReader"
          component={AyahReaderScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="MemorizationMode"
          component={MemorizationModeScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="IslamicHub"
          component={IslamicHubScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Developer"
          component={DeveloperScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
