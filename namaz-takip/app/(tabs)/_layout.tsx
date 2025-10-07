import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const TopTabs = createMaterialTopTabNavigator();

export default function TopTabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <TopTabs.Navigator
      screenOptions={({ route }: { route: { name: string } }) => ({
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarIndicatorStyle: { backgroundColor: Colors[colorScheme].tint },
        tabBarStyle: { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
        tabBarShowIcon: true,
        tabBarIcon: ({ color }: { color?: string }) => {
          const iconColor = color ?? Colors[colorScheme].tint;
          // simple mapping of route.name to an icon
          const name = route.name;
          if (name === 'takvim') return <IconSymbol size={18} name="calendar" color={iconColor} />;
          if (name === 'gun-detay') return <IconSymbol size={18} name="doc.text" color={iconColor} />;
          if (name === 'profil') return <IconSymbol size={18} name="person.crop.circle" color={iconColor} />;
          return null;
        },
        headerShown: false,
      })}>
      <TopTabs.Screen name="takvim" options={{ title: 'Takvim' }} component={() => <Slot />} />
      <TopTabs.Screen name="gun-detay" options={{ title: 'Gün Detay' }} component={() => <Slot />} />
      <TopTabs.Screen name="profil" options={{ title: 'Profil' }} component={() => <Slot />} />
    </TopTabs.Navigator>
  );
}
