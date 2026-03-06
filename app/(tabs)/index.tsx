import { usePrayerTimes } from '@/actions/getPrayerTimes';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { PrayerTimes } from '@/types';
import { Cloud, Moon, Sun, Sunrise, Sunset } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type Status = 'done' | 'active' | 'upcoming';

function getNextPrayer(prayers: PrayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert current time to minutes

  const prayerTimes = Object.entries(prayers).map(([name, time]) => {
    const [hour, minute] = time.split(':').map(Number);
    const prayerTime = hour * 60 + minute; // Convert prayer time to minutes
    return { name, time, prayerTime };
  });

  // Find the next prayer
  for (const prayer of prayerTimes) {
    if (currentTime < prayer.prayerTime) {
      return prayer;
    }
  }

  // If all prayers have passed, return the first one for the next day
  return prayerTimes[0];
}

function getActivePrayer(prayers: PrayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const prayerTimes = [
    { name: 'Fajr', time: prayers.Fajr },
    { name: 'Dhuhr', time: prayers.Dhuhr },
    { name: 'Asr', time: prayers.Asr },
    { name: 'Maghrib', time: prayers.Maghrib },
    { name: 'Isha', time: prayers.Isha },
  ].map((prayer) => {
    const [hour, minute] = prayer.time.split(':').map(Number);
    return { ...prayer, prayerTime: hour * 60 + minute };
  });

  for (let i = prayerTimes.length - 1; i >= 0; i--) {
    if (currentTime >= prayerTimes[i].prayerTime) {
      return prayerTimes[i];
    }
  }

  // Before Fajr, the active window is still Isha from the previous day.
  return prayerTimes[prayerTimes.length - 1];
}

function determineStatus(prayerName: string, prayers: PrayerTimes): Status {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Convert all prayer times to minutes
  const prayerArray = [
    { name: 'Fajr', time: prayers.Fajr },
    { name: 'Dhuhr', time: prayers.Dhuhr },
    { name: 'Asr', time: prayers.Asr },
    { name: 'Maghrib', time: prayers.Maghrib },
    { name: 'Isha', time: prayers.Isha },
  ].map(p => {
    const [hour, minute] = p.time.split(':').map(Number);
    return { ...p, minutes: hour * 60 + minute };
  });

  // Find the current active prayer (last prayer that has started)
  let activePrayerIndex = -1;
  for (let i = prayerArray.length - 1; i >= 0; i--) {
    if (currentTime >= prayerArray[i].minutes) {
      activePrayerIndex = i;
      break;
    }
  }

  // If no prayer has started yet, all are upcoming
  if (activePrayerIndex === -1) {
    return 'upcoming';
  }

  const activePrayer = prayerArray[activePrayerIndex];
  const prayerIndex = prayerArray.findIndex(p => p.name === prayerName);

  if (prayerName === activePrayer.name) {
    return 'active';
  } else if (prayerIndex < activePrayerIndex) {
    return 'done';
  } else {
    return 'upcoming';
  }
}

function getCountdownToPrayer(time: string) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [hour, minute] = time.split(':').map(Number);
  const targetMinutes = hour * 60 + minute;

  let diffMinutes = targetMinutes - currentMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}H ${minutes}m`;
}

export default function MaqitScreen() {
  const { data: prayers, isLoading, error } = usePrayerTimes();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [activePrayer, setActivePrayer] = useState<{ name: string; time: string } | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching prayer times:', error);
    }
  }, [error]);

  useEffect(() => {
    if (prayers) {
      const next = getNextPrayer(prayers);
      const active = getActivePrayer(prayers);
      setNextPrayer(next);
      setActivePrayer(active);
    }
  }, [prayers, isLoading]);

  const countdown = nextPrayer ? getCountdownToPrayer(nextPrayer.time) : null;

  return (
    <View style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Prayer Banner ───────────────────────── */}
        <View style={styles.bannerActive}>
          <View>
            <Text style={styles.bannerLabel}>ACTIVE PRAYER</Text>
            <Text style={styles.bannerName}>{activePrayer?.name}</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerTime}>{activePrayer?.time}</Text>
            <Text style={styles.bannerCountdown}>Current window</Text>
          </View>
        </View>

        {/* ── Next Prayer Banner ─────────────────────────── */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerLabel}>NEXT PRAYER</Text>
            <Text style={styles.bannerName}>{nextPrayer?.name}</Text>
            <Text style={styles.bannerDate}>Thu, 19 February</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerTimeMuted}>{nextPrayer?.time}</Text>
            <Text style={styles.bannerCountdown}>{countdown ? `in ${countdown}` : ''}</Text>
          </View>
        </View>

        {/* ── Prayer List ────────────────────────────────── */}
        <View style={styles.list}>
          {!isLoading && prayers ? (
            <>
              <PrayerRow name="Fajr" time={prayers.Fajr} Icon={Sunrise} label="Pre-dawn" theme={theme} prayers={prayers} activePrayerName={activePrayer?.name} nextPrayerName={nextPrayer?.name} />
              <PrayerRow name="Dhuhr" time={prayers.Dhuhr} Icon={Sun} label="Noon" theme={theme} prayers={prayers} activePrayerName={activePrayer?.name} nextPrayerName={nextPrayer?.name} />
              <PrayerRow name="Asr" time={prayers.Asr} Icon={Cloud} label="Afternoon" theme={theme} prayers={prayers} activePrayerName={activePrayer?.name} nextPrayerName={nextPrayer?.name} />
              <PrayerRow name="Maghrib" time={prayers.Maghrib} Icon={Sunset} label="Sunset" theme={theme} prayers={prayers} activePrayerName={activePrayer?.name} nextPrayerName={nextPrayer?.name} />
              <PrayerRow name="Isha" time={prayers.Isha} Icon={Moon} label="Night" theme={theme} prayers={prayers} activePrayerName={activePrayer?.name} nextPrayerName={nextPrayer?.name} />
            </>
          ) : (
            <ActivityIndicator
              size="small"
              color={theme.textDim}
              style={styles.loadingSpinner}
            />
          )}
        </View>

        {/* ── Tagline ───────────────────────────────────── */}
      </ScrollView >
    </View >
  );
}

function PrayerRow({
  name,
  time,
  Icon,
  label,
  theme,
  prayers,
  activePrayerName,
  nextPrayerName,
}: {
  name: string;
  time: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  theme: (typeof Colors)['light'];
  prayers: PrayerTimes;
  activePrayerName?: string;
  nextPrayerName?: string;
}) {
  const status = determineStatus(name, prayers);
  const isActive = activePrayerName === name;
  const isNext = nextPrayerName === name;
  const isDone = status === 'done';
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const iconColor = isActive ? theme.green : isDone ? theme.textDim : theme.textMuted;

  return (
    <View
      style={[
        styles.row,
        isActive && styles.rowActive,
        isNext && styles.rowNext,
        isDone && styles.rowDone,
      ]}
    >
      {/* Icon pill */}
      <View style={[styles.iconPill, isActive && styles.iconPillActive, isNext && styles.iconPillNext]}>
        <Icon
          size={16}
          color={iconColor}
        />
      </View>

      {/* Name + label */}
      <View style={styles.rowMid}>
        <Text
          style={[
            styles.prayerName,
            isActive && styles.prayerNameActive,
            isNext && styles.prayerNameNext,
            isDone && styles.prayerNameDone,
          ]}
        >
          {name}
        </Text>
        <Text style={styles.prayerLabel}>{label}</Text>
      </View>

      {/* Time + badge */}
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.prayerTime,
            isActive && styles.prayerTimeActive,
            isNext && styles.prayerTimeNext,
            isDone && styles.prayerTimeDone,
          ]}
        >
          {time}
        </Text>
        {isNext && <Text style={styles.badgeActive}>NEXT</Text>}
        {isActive && <Text style={styles.badgeActive}>CURRENT</Text>}
        {isDone && <Text style={styles.badgeDone}>Done</Text>}
      </View>
    </View>
  );
}

const createStyles = (theme: (typeof Colors)['light']) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      flex: 1,
    },
    container: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },

    // Banner
    banner: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    bannerActive: {
      backgroundColor: theme.bannerBg,
      borderWidth: 1,
      borderColor: theme.bannerBorder,
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
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
    bannerTimeMuted: {
      fontSize: 30,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -1,
    },
    bannerCountdown: {
      fontSize: 12,
      color: theme.textDim,
      marginTop: 4,
    },

    // Prayer list
    list: {
      gap: 9,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      padding: 12,
      paddingHorizontal: 14,
      backgroundColor: theme.overlay,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowActive: {
      backgroundColor: theme.bannerBg,
      borderColor: theme.bannerBorder,
    },
    rowNext: {
      backgroundColor: theme.surface,
      borderColor: theme.bannerBorder,
    },
    rowDone: {
      backgroundColor: theme.surfaceAlt,
      borderColor: theme.border,
    },

    iconPill: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconPillActive: {
      backgroundColor: theme.bannerBg,
    },
    iconPillNext: {
      backgroundColor: theme.surfaceAlt,
    },

    rowMid: {
      flex: 1,
    },
    prayerName: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.textMuted,
      letterSpacing: -0.3,
    },
    prayerNameActive: {
      fontWeight: '700',
      color: theme.text,
    },
    prayerNameNext: {
      fontWeight: '700',
      color: theme.text,
    },
    prayerNameDone: {
      color: theme.textDim,
    },
    prayerLabel: {
      fontSize: 11,
      color: theme.textDim,
      marginTop: 1,
    },

    rowRight: {
      alignItems: 'flex-end',
    },
    prayerTime: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: theme.textDim,
    },
    prayerTimeActive: {
      color: theme.green,
    },
    prayerTimeNext: {
      color: theme.text,
    },
    prayerTimeDone: {
      color: theme.textDim,
    },
    badgeActive: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.green,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    badgeDone: {
      fontSize: 10,
      color: theme.textDim,
      marginTop: 2,
    },
    loadingText: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textDim,
      marginVertical: 8,
    },
    loadingSpinner: {
      marginVertical: 10,
    },
  });