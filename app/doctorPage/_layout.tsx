import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Platform } from 'react-native';

import { HapticTab } from '../../components/HapticTab';
import TabBarBackground from '../../components/ui/TabBarBackground';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused
                  ? Colors[colorScheme ?? 'light'].tint
                  : '#888', // adjust inactive color
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/community.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused
                  ? Colors[colorScheme ?? 'light'].tint
                  : '#888',
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profileEdit"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/profileEdit.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: focused
                  ? Colors[colorScheme ?? 'light'].tint
                  : '#888',
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
