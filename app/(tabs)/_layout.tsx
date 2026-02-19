import { Header } from '@/components/Header';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Tabs } from 'expo-router';
import { Box, HandHelping } from 'lucide-react-native';
import React, { Suspense } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        header: () => (
          <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
            <Suspense fallback={<Text style={{ color: theme.text, paddingHorizontal: 20 }}>Loading...</Text>}>
              <Header />
            </Suspense>
          </SafeAreaView>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Prayer Times',
          tabBarIcon: ({ color }) => <HandHelping color={color} />,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'Qibla',
          tabBarIcon: ({ color }) => <Box color={color} />,
        }}
      ></Tabs.Screen>
    </Tabs>
  );
}
