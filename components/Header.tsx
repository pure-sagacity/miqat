import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function Header() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const iconColor = theme.textDim;

  return (
    <View style={styles.wrapper}>
      {/* Top row: title + icon buttons */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.appName}>Maqit</Text>
          <Text style={styles.tagline}>Simple and ad-free -- always.</Text>
        </View>
        <View style={styles.iconButtons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
          >
            <Settings size={14} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: (typeof Colors)['light']) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: theme.background,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    appName: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1.2,
    },
    iconButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.overlay,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Banner
    banner: {
      backgroundColor: theme.bannerBg,
      borderWidth: 1,
      borderColor: theme.bannerBorder,
      borderRadius: 20,
      padding: 18,
      paddingHorizontal: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 20,
    },
    bannerLabel: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: 4,
    },
    bannerName: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.8,
    },
    bannerDate: {
      fontSize: 12,
      color: theme.textDim,
      marginTop: 4,
    },
    bannerRight: {
      alignItems: 'flex-end',
    },
    bannerTime: {
      fontSize: 36,
      fontWeight: '800',
      color: theme.green,
      letterSpacing: -2,
    },
    bannerCountdown: {
      fontSize: 12,
      color: theme.textDim,
      marginTop: 4,
    },
    // Tagline
    tagline: {
      textAlign: 'center',
      paddingTop: 5,
      fontSize: 11,
      color: theme.textDim,
      letterSpacing: 0.3,
    },
  });
