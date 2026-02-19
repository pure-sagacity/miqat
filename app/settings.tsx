import { useThemePreference } from '@/components/ThemeProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ThemeOption = 'system' | 'light' | 'dark';

const OPTIONS: Array<{ label: string; value: ThemeOption }> = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
];

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const { preference, setPreference } = useThemePreference();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
                <Text style={[styles.label, { color: theme.textMuted }]}>APPEARANCE</Text>
                <Text style={[styles.title, { color: theme.text }]}>Theme</Text>
                <View style={[styles.segment, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                >
                    {OPTIONS.map((option) => {
                        const isActive = preference === option.value;
                        return (
                            <Pressable
                                key={option.value}
                                onPress={() => setPreference(option.value)}
                                style={({ pressed }) => [
                                    styles.segmentButton,
                                    {
                                        backgroundColor: isActive ? theme.surface : 'transparent',
                                        borderColor: isActive ? theme.borderStrong : 'transparent',
                                        opacity: pressed ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.segmentLabel,
                                        { color: isActive ? theme.text : theme.textDim },
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Text style={[styles.helper, { color: theme.textDim }]}
                >
                    System follows your device appearance. Light and Dark override it.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    segment: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        padding: 4,
        gap: 6,
    },
    segmentButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    segmentLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    helper: {
        marginTop: 12,
        fontSize: 12,
        lineHeight: 18,
    },
});
